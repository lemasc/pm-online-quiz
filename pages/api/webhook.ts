import admin from "@/shared/firebase-admin";
import { sessionOptions } from "@/shared/session";
import { FeedbackToken } from "@/types/exam";
import axios from "axios";
import { unsealData } from "iron-session";
import { NextApiHandler } from "next";

type WebhookBody = {
  type: "ISSUE_FORM" | "FEEDBACK_FORM";
  data: [string, string[]][];
};

const allowedTypes: WebhookBody["type"][] = ["FEEDBACK_FORM", "ISSUE_FORM"];

const db = admin.firestore();
const auth = admin.auth();

const verifyBody = (body: Record<string, unknown>): body is WebhookBody => {
  return (
    typeof body.type === "string" &&
    allowedTypes.includes(body.type as any) &&
    Array.isArray(body.data)
  );
};

const handler: NextApiHandler = async (req, res) => {
  if (!verifyBody(req.body)) {
    return res.status(400).json({ success: true, error: "invalid_body" });
  }
  try {
    const body = Object.fromEntries(req.body.data);
    if (req.body.type === "ISSUE_FORM") {
      const isNameIssue = Object.keys(body).some((v) => v.includes("ชื่อ"));
      const fields = req.body.data
        .map(([key, value]) => `${key}: ${value.join(" ")}`)
        .join("\n");
      let message = ["แจ้งปัญหาการใช้งาน", fields];
      if (isNameIssue) {
        /*const doc = await db.collection("drafts").add(body);
        message.push(
          `ตรวจสอบและบันทึกการแก้ไข:\nhttps://${req.headers.host}/admin/users/update/${doc.id}`
        );*/
        try {
          const email = req.body.data.find(([key, value]) =>
            key.includes("อีเมล")
          )?.[1];
          if (!email) throw new Error("Email form key not found.");
          const user = await auth.getUserByEmail(email[0]);
          await db.collection("users").doc(user.uid).update({
            pendingEdit: true,
          });
        } catch (err) {
          return void res
            .status(401)
            .json({ success: false, message: (err as Error).message });
        }
      }
      await axios.post(
        "https://notify-api.line.me/api/notify",
        new URLSearchParams({
          message: message.join("\n\n"),
        }),
        {
          headers: {
            Authorization: `Bearer ${process.env.LINE_TOKEN}`,
          },
        }
      );
    } else if (req.body.type === "FEEDBACK_FORM") {
      // Get our token from responses
      try {
        const token = Object.values(body)[0][0];
        if (!token) throw new Error("No token found");
        const { userId } = await unsealData<FeedbackToken>(
          token,
          sessionOptions
        );
        await db
          .collection("users")
          .doc(userId)
          .update({ surveyAnswered: true });
      } catch (err) {
        console.error(err);
        return void res.status(400).end();
      }
    }
    res.status(200).end();
  } catch (err) {
    if (axios.isAxiosError(err)) {
      console.error(err.response?.data);
    } else {
      console.error(err);
    }
    res.status(500).end();
  }
};

export default handler;
