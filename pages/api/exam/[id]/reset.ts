import admin from "@/shared/firebase-admin";
import { sessionOptions } from "@/shared/session";
import { DownloadToken } from "@/types/exam";
import { unsealData } from "iron-session";
import { NextApiHandler } from "next";

// This endpoint does exist for demo purposes, but it's not used in the app.
const handler: NextApiHandler = async (ctx, res) => {
  try {
    const id = ctx.query?.id;
    const token = ctx.query?.token;
    if (typeof id !== "string" || typeof token !== "string") {
      throw new Error("Invalid params");
    }

    const tokenData = await unsealData<DownloadToken>(token, sessionOptions);
    if (id !== tokenData.submissionId) {
      throw new Error("ID token and request mismatched.");
    }
    await admin
      .firestore()
      .collection("users")
      .doc("demo-user")
      .collection("submissions")
      .doc(id)
      .delete();
  } catch (err) {
    console.error(err);
  }
  res.status(302).redirect("/home");
};

export default handler;
