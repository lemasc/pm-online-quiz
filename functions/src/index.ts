/* eslint-disable indent */
/* eslint-disable object-curly-spacing */
/* eslint-disable quote-props */
import * as functions from "firebase-functions";
import * as dotenv from "dotenv";
import axios from "axios";
import * as admin from "firebase-admin";

dotenv.config();
admin.initializeApp();

const db = admin.firestore;
const auth = admin.auth();

type UserProfile = {
  "#"?: string;
  studentId: number;
  studentNo: number;
  nameTitle: string;
  name: string;
  class: number;
  level: number;
};

type ApiResponse = {
  error?: Record<string, unknown>;
  items: UserProfile[];
};

export const loadUserData = functions.auth.user().onCreate(async (user) => {
  const email = user.email?.split("@");
  if (
    email &&
    email[1] === process.env.EMAIL_HD &&
    !isNaN(parseInt(email[0]))
  ) {
    const studentId = parseInt(email[0]);
    try {
      const { data } = await axios.get<ApiResponse>(
        process.env.API_ENDPOINT as string,
        {
          params: {
            path: "/students",
            query: JSON.stringify({ studentId }),
          },
        }
      );
      if (data.error) throw new Error("API returned an error.");
      else if (data.items.length === 0) {
        throw new Error(`User with student ID ${studentId} not found.`);
      }
      auth.setCustomUserClaims(user.uid, {
        class: data.items[0].class,
      });
      delete data.items[0]["#"];
      db().collection("users").doc(user.uid).set(data.items[0]);
    } catch (err) {
      console.error(err);
    }
  } else {
    functions.logger.error(
      `Warning: Cannot parse student ID email. ${user.email}`
    );
  }

  // Update summary
  return db()
    .collection("summary")
    .doc("summary")
    .set(
      {
        users: admin.firestore.FieldValue.increment(1),
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      },
      {
        merge: true,
      }
    );
});

exports.removeUsers = functions.auth.user().onDelete(async () => {
  return db()
    .collection("summary")
    .doc("summary")
    .set(
      {
        users: admin.firestore.FieldValue.increment(-1),
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      },
      {
        merge: true,
      }
    );
});
