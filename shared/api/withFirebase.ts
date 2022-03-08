import { NextApiHandler } from "next";
import admin from "../firebase-admin";
import { auth } from "firebase-admin";
import { DownloadToken, ExamModel, ExamSubmission } from "@/types/exam";
import { readFile, withDocumentDatesParsed } from "./base";
import { unsealData } from "iron-session";
import { sessionOptions } from "../session";
import { UserMetadata } from "@/context/auth";

declare module "next" {
  interface NextApiRequest {
    token: auth.DecodedIdToken;
  }
}

export async function getSubmission(token: string, id: string) {
  const { userId, submissionId } = await unsealData<DownloadToken>(
    token,
    sessionOptions
  );
  if (id !== submissionId) throw new Error("ID token and request mismatched.");
  const submission = await admin
    .firestore()
    .collection("users")
    .doc(userId)
    .collection("submissions")
    .doc(id)
    .get();
  if (!submission.exists) throw new Error("Submission not found.");
  const submissionData = submission.data() as ExamSubmission;
  const examData = (await readFile(id, "index.json")) as ExamModel;

  const metadataDoc = await admin
    .firestore()
    .collection("users")
    .doc(userId)
    .get();

  if (!metadataDoc.exists) throw new Error("User metadata not found.");

  return {
    metadata: metadataDoc.data() as UserMetadata,
    submission: {
      ...withDocumentDatesParsed(submissionData, [
        "startTime",
        "submittedTime",
      ]),
    },
    exam: examData,
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
    } catch (error) {
      console.error(error);
      return void res.status(500).end();
    }
    return handler(req, res);
  };
};
