import admin from "@/shared/firebase-admin";
import axios from "axios";
import { NextApiHandler } from "next";

type WebhookBody = {
  type: "ISSUE_FORM" | "FEEDBACK_HOME";
  data: [string, string[]][];
};

const db = admin.firestore();
const verifyBody = (body: Record<string, unknown>): body is WebhookBody => {
  return (
    typeof body.type === "string" &&
    ["ISSUE_FORM", "FEEDBACK_FORM"].includes(body.type) &&
    Array.isArray(body.data)
  );
};

const handler: NextApiHandler = async (req, res) => {
  console.log(req.body);
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
        const doc = await db.collection("drafts").add(body);
        message.push(
          `ตรวจสอบและบันทึกการแก้ไข:\nhttps://${req.headers.host}/admin/users/update/${doc.id}`
        );
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
