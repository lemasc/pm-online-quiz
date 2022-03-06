import * as firebase from "firebase-admin";

const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = (process.env.FIREBASE_PRIVATE_KEY as string).replace(
  /\\n/g,
  "\n"
);

const admin = !firebase.apps.length
  ? firebase.initializeApp({
      credential: firebase.credential.cert({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        clientEmail,
        privateKey,
      }),
    })
  : firebase.app();

export default admin;
