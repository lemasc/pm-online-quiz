import admin from "@/shared/firebase-admin";
import { sessionOptions } from "@/shared/session";
import { FeedbackToken } from "@/types/exam";
import { sealData } from "iron-session";
import { NextApiHandler } from "next";

const auth = admin.auth();
const feedbackForm: NextApiHandler = async (req, res) => {
  const token = req.query.token;
  if (typeof token !== "string" || req.method !== "GET") {
    return void res.status(400).end();
  }
  try {
    const user = await auth.verifyIdToken(token);
    const seal = await sealData<FeedbackToken>(
      { userId: user.uid },
      sessionOptions
    );
    res.status(302).redirect(`${process.env.FEEDBACK_FORM_URL}${seal}`);
  } catch (err) {
    console.error(err);
    res.status(401).end();
  }
};

export default feedbackForm;
