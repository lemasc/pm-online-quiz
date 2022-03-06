import {
  decodeSegmentsMap,
  ExamApiHandler,
  ExamQuery,
  readFile,
  withExamSession,
  withFirebase,
} from "@/shared/api";
import admin from "@/shared/firebase-admin";
import { ExamSubmission, ExamSubmitBody, GenericExamModel } from "@/types/exam";

type Answer = {
  item: string;
  index: number;
  selected: number;
};

const db = admin.firestore();

const submit: ExamApiHandler<ExamQuery, ExamSubmitBody> = async (req, res) => {
  if (req.token.uid !== req.session.uid) {
    return void res.status(403).end();
  }
  try {
    const answers = decodeSegmentsMap<Answer>(
      req.examData.hash,
      req.body.answers,
      (key, item) => ({
        item: item as string,
        ...req.body.answers[key],
      })
    );
    try {
      const results = (
        await Promise.all(
          Array.from(answers.entries()).map(async ([key, entries]) => {
            const { items } = await readFile<GenericExamModel>(
              req.query.id as string,
              key,
              "index.json"
            );
            // Warning: Results doesn't sort in order.
            return entries.map((ans) => {
              return ans.selected === items?.[ans.item]?.selected;
            });
          })
        )
      ).flat();

      const score = results.reduce((prev, cur) => prev + Number(cur), 0);
      const payload: ExamSubmission = {
        // answers
        score,
        total: results.length,
        hash: req.examData.hash,
        answers: req.body.answers,
        // exam info
        startTime: new Date(req.examData.startTime),
        submittedTime: new Date(),
      };
      await db
        .collection("users")
        .doc(req.token.uid)
        .collection("submissions")
        .doc(req.query.id)
        .set(payload);
      delete req.session.exam?.[req.query.id];
      await req.session.save();
      res.status(200).end();
    } catch (err) {
      console.error(err);
      res.status(500).end();
    }
  } catch (err) {
    console.error(err);
    res.status(403).end();
  }
};

export default withFirebase(
  withExamSession(submit, {
    method: "POST",
    noTimeCheck: true,
    verifyBody: (body) => {
      return body.answers !== null && typeof body.answers === "object";
    },
    // Don't check time.
  })
);
