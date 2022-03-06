import type { GetServerSideProps, NextApiHandler } from "next";
import { withIronSessionApiRoute, withIronSessionSsr } from "iron-session/next";
import { ExamSessionData } from "@/types/exam";

export const sessionOptions = {
  password: process.env.SESSION_PASSWORD as string,
  cookieName: "__exam",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
  },
};

export function withSession(handler: GetServerSideProps) {
  return withIronSessionSsr(handler, sessionOptions);
}

export function withAPISession(handler: NextApiHandler) {
  return withIronSessionApiRoute(handler, sessionOptions);
}

declare module "iron-session" {
  interface IronSessionData {
    uid?: string;
    exam?: Record<string, ExamSessionData>;
  }
}
