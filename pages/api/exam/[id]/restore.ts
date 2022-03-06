import {
  decodeSegmentsMap,
  ExamApiHandler,
  ExamQuery,
  withExamSession,
  withFirebase,
} from "@/shared/api";
import { ExamStartPayload } from "@/types/exam";

const checkValidity: ExamApiHandler<ExamQuery, ExamStartPayload> = async (
  req,
  res
) => {
  if (req.session.uid !== req.token.uid) {
    return void res.status(403).end();
  }
  try {
    decodeSegmentsMap(req.examData.hash, req.body.data);
    if (req.body.content)
      decodeSegmentsMap(req.examData.hash, req.body.content);
    // Additionally, check the answers object?
    if (req.body.answers) {
      Object.entries(req.body.answers).forEach(([k, v]) => {
        if (isNaN(parseInt(k)) || isNaN(v))
          throw new Error("Invalid answer payload");
      });
    }
    // All item keys are decodable with the current `session` hash.
    // We should treat this a complete payload. No additional requests should be made.
    // If any requests are MALFORMED or NOT FOUND, throw the error in other endpoints at runtime.
    res.status(200).end();
  } catch (err) {
    console.error(err);
    res.status(400).end();
  }
};

export default withFirebase(
  withExamSession(checkValidity, {
    method: "POST",
    verifyBody: (body) => {
      return Array.isArray(body.data);
    },
    noTimeCheck: true,
  })
);
