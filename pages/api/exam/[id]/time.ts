import { ExamApiHandler, withExamSession } from "@/shared/api";

const timeCheckRequest: ExamApiHandler = async (req, res) => {
  res.status(200).end();
};

export default withExamSession(timeCheckRequest, {
  method: "GET",
  noCache: true,
});
