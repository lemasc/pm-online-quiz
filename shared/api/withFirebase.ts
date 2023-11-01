import { UserMetadata } from "@/context/auth";
import { DownloadToken, ExamModel, ExamSubmission } from "@/types/exam";
import { auth } from "firebase-admin";
import { unsealData } from "iron-session";
import { NextApiHandler } from "next";
import admin from "../firebase-admin";
import { sessionOptions } from "../session";
import { readFile, withDocumentDatesParsed } from "./base";

declare module "next" {
  interface NextApiRequest {
    token: auth.DecodedIdToken;
  }
}

export async function getSubmission(token: string, id: string) {
  const tokenData = await unsealData<DownloadToken>(token, sessionOptions);
  if (id !== tokenData.submissionId)
    throw new Error("ID token and request mismatched.");
  const submission = await admin
    .firestore()
    .collection("users")
    .doc(tokenData.userId)
    .collection("submissions")
    .doc(id)
    .get();
  if (!submission.exists) throw new Error("Submission not found.");
  const submissionData = submission.data() as ExamSubmission;
  const examData = (await readFile(id, "index.json")) as ExamModel;
  /*
  const metadataDoc = await admin
    .firestore()
    .collection("users")
    .doc(tokenData.userId)
    .get();

  if (!metadataDoc.exists) throw new Error("User metadata not found.");*/
  const metadata: UserMetadata = {
    class: 1,
    level: 6,
    name: "ผู้ใช้งาน DEMO",
    nameTitle: "",
    studentId: 99999,
    studentNo: 1,
  };

  return {
    metadata,
    submission: {
      ...withDocumentDatesParsed(submissionData, [
        "startTime",
        "submittedTime",
      ]),
    },
    exam: examData,
    tokenData,
  };
}

export const withFirebase = (handler: NextApiHandler): NextApiHandler => {
  return async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ success: false });
    }
    const auth = admin.auth();
    const token = authHeader.split(" ")[1];
    try {
      const decodedToken = await auth.verifyIdToken(token);
      if (!decodedToken || !decodedToken.uid) return void res.status(401).end();
      req.token = decodedToken;
      req.token.uid = "demo-user";
    } catch (error) {
      console.error(error);
      return void res.status(500).end();
    }
    return handler(req, res);
  };
};
