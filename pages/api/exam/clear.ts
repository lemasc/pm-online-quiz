import { withAPISession } from "@/shared/session";
import { NextApiHandler } from "next";

const clearSession: NextApiHandler = async (req, res) => {
  delete req.session.exam;
  await req.session.save();
  return void res.status(200).end();
};

export default withAPISession(clearSession);
