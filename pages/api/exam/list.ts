import { readFile, withDocumentDatesParsed, withFirebase } from "@/shared/api";
import admin from "@/shared/firebase-admin";
import { sessionOptions, withAPISession } from "@/shared/session";
import {
  DownloadToken,
  ExamAPIItem,
  ExamListModel,
  ExamSubmission,
  SubmissionAPIItem,
} from "@/types/exam";
import { sealData } from "iron-session";
import { NextApiHandler } from "next";

const db = admin.firestore();

const examList: NextApiHandler<ExamListModel> = async (req, res) => {
  try {
    const rawExam = await readFile<ExamAPIItem[]>("index.json");
    const rawSubmission = await db
      .collection("users")
      .doc(req.token.uid)
      .collection("submissions")
      .get();
    const rawSession = req.session.exam;
    // Set up maps
    const ready = new Map<string, ExamAPIItem>();
    const onProgress: ExamAPIItem[] = [];
    const submission = new Map<string, SubmissionAPIItem>();
    rawExam.map((v) => {
      // @ts-ignore
      delete v.items;
      ready.set(v.id, { ...v, status: "READY", id: v.id, count: 10 });
    });

    await Promise.all(
      rawSubmission.docs.map(async (v) => {
        const doc = v.data();
        delete doc.answers;
        delete doc.hash;
        const data = withDocumentDatesParsed(doc as ExamSubmission, [
          "startTime",
          "submittedTime",
        ]);
        submission.set(v.id, {
          ...data,
          ...(ready.get(v.id) as any),
          downloadToken: await sealData<DownloadToken>(
            { userId: req.token.uid, submissionId: v.id },
            sessionOptions
          ),
          status: "SUBMITTED",
        });
        ready.delete(v.id);
      })
    );

    if (rawSession) {
      Object.keys(rawSession).map((id) => {
        onProgress.push({ ...(ready.get(id) as any), status: "ON_PROGRESS" });
        ready.delete(id);
      });
    }

    return res.status(200).json({
      exam: [...onProgress, ...Array.from(ready.values())],
      submission: Object.fromEntries(Array.from(submission.entries())),
    });
  } catch (err) {
    console.error(err);
    return void res.status(500).end();
  }
};

export default withFirebase(withAPISession(examList));
