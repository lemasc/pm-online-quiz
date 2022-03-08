import type { GetServerSideProps, NextApiHandler } from "next";
import { withIronSessionApiRoute, withIronSessionSsr } from "iron-session/next";
import { ExamSessionData } from "@/types/exam";
import { IronSessionOptions } from "iron-session";

export const sessionOptions: IronSessionOptions = {
  password: process.env.SESSION_PASSWORD as string,
  cookieName: "__exam",
  ttl: 24 * 60 * 60,
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
  },
};

export function withSession<
  P extends { [key: string]: any } = { [key: string]: any }
>(handler: GetServerSideProps<P>) {
  return withIronSessionSsr<P>(handler, sessionOptions);
}

export function withAPISession(handler: NextApiHandler) {
  return withIronSessionApiRoute(handler, sessionOptions);
}

declare module "iron-session" {
  interface IronSessionData {
    exam?: Record<string, ExamSessionData>;
  }
}
