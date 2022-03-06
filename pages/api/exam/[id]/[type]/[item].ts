import {
  decodeSegments,
  ExamApiHandler,
  readFile,
  withExamSession,
} from "@/shared/api";
import { withAPISession } from "@/shared/session";
import { GenericExamModel } from "@/types/exam";
import { QuizItem } from "@/types/model";
import { NextApiHandler } from "next";

type ExamQuery = {
  id: string;
  item: string;
  type: string;
};

type Handler = (
  query: ExamQuery,
  segments: string[]
) => Promise<Partial<QuizItem> | void>;

type TYPE = "content" | "item";

const itemHandler: Handler = async (query, segments) => {
  const item = parseInt(segments.pop() as string);
  const { items } = await readFile<GenericExamModel>(
    query.id,
    ...segments,
    "index.json"
  );
  if (!items?.[item]) throw new Error(`Item with the index ${item} not found.`);
  return { ...items[item], selected: -1 };
};

const contentHandler: Handler = async (query, segments) => {
  const { content } = await readFile<GenericExamModel>(
    query.id,
    ...segments,
    "content.json"
  );
  if (!content) {
    throw new Error("Content not found");
  }
  return { id: query.item, content };
};

const itemRequest: ExamApiHandler<ExamQuery> = async (req, res) => {
  try {
    const segments = decodeSegments(req.examData.hash, req.query.item);
    try {
      switch (req.query.type as TYPE) {
        case "content":
          return res
            .status(200)
            .send(await contentHandler(req.query, segments));
        case "item":
          return res.status(200).send(await itemHandler(req.query, segments));
        default:
          res.status(400).end();
          return;
      }
    } catch (err) {
      console.error(err);
      res.status(404).end();
    }
  } catch (err) {
    console.error(err);
    res.status(500).end();
  }
};

export default withExamSession(itemRequest, {
  method: "GET",
  verifyQuery: (query) => {
    return typeof query.item === "string" && typeof query.type === "string";
  },
});
