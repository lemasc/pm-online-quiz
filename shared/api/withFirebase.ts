import { NextApiHandler } from "next";
import admin from "../firebase-admin";
import { auth } from "firebase-admin";

declare module "next" {
  interface NextApiRequest {
    token: auth.DecodedIdToken;
  }
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
