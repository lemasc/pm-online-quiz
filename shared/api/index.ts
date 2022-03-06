import { ExamSessionData } from "@/types/exam";
import axios from "axios";
import dayjs from "dayjs";
import fs from "fs/promises";
import { IncomingMessage } from "http";
import { NextApiRequest, NextApiResponse } from "next";
import path from "path";
import { withAPISession } from "../session";

export const readFile = async <T = any>(...segments: string[]): Promise<T> => {
  /*return JSON.parse(
    await fs.readFile(path.join("exam", ...segments), {
      encoding: "utf-8",
    })
  );*/
  return axios
    .get<T>(`/${segments.join("/")}`, {
      baseURL: process.env.DATA_URL,
    })
    .then((v) => v.data);
};

export const decodeSegments = (
  hash: ExamSessionData["hash"],
  segments: string
) => {
  const splited = segments.split("~");
  return splited.map((value, index) => {
    if (index === splited.length - 1 && value.length === 1) {
      // Last index, return number from String charcode
      const item = value.charCodeAt(0) - 64;
      if (isNaN(item) || item < 1)
        throw new Error(`Cannot parse item index char code ${value}.`);
      return item.toString();
    } else {
      // Replace the hash with the actual path;
      const path = hash[value];
      if (!path)
        throw new Error(`Cannot find path matched with the hash ${value}.`);
      return path;
    }
  });
};

/**
 * Use when receiving HTTP request body and convert into segments map.
 */
export const decodeSegmentsMap = <T = string>(
  hashes: ExamSessionData["hash"],
  record: string[] | Record<string, any>,
  mapFunction?: (key: string, item?: string) => T
): Map<string, T[]> => {
  const sections = new Map<string, T[]>();
  // In objects we only use their keys.
  const target = Array.isArray(record) ? record : Object.keys(record);
  // Decode segments for each answers.
  for (let index = 0; index < target.length; index++) {
    const key = target[index];
    const segments = decodeSegments(hashes, key);
    const item = !isNaN(parseInt(segments.at(-1) as string))
      ? (segments.pop() as string)
      : undefined;
    const mapKey = segments.join("/");
    sections.set(mapKey, [
      ...(sections.get(mapKey) ?? []),
      mapFunction ? mapFunction(key, item) : (item as never as T),
    ]);
  }
  return sections;
};

/**
 * Clears the current exam session. Must called `req.session.save()` after.
 */
export const clearExamSession = (req: IncomingMessage, path: string) => {
  const examHash = req.session.exam?.[path].hash;
  if (examHash) {
    delete req.session.exam?.[path];
  }
};

type APIOptions<Q extends ExamQuery = ExamQuery, B extends Query = {}> = {
  method: "GET" | "POST";
  noCache?: boolean;
  noTimeCheck?: boolean;
  verifyQuery?: (query: NextApiRequest["query"] & ExamQuery) => boolean;
  verifyBody?: (body: Record<string, unknown>) => boolean;
};

type Query = Record<string, unknown>;

type TypedNextAPIRequest<
  Q extends ExamQuery = ExamQuery,
  B extends Query = {}
> = Omit<NextApiRequest, "query" | "body"> & {
  query: Q;
  body: B;
};

type ExamAPIRequest<
  Q extends ExamQuery = ExamQuery,
  B extends Query = {}
> = TypedNextAPIRequest<Q, B> & {
  examData: ExamSessionData;
};

export type ExamApiHandler<
  Q extends ExamQuery = ExamQuery,
  B extends Query = {}
> = (req: ExamAPIRequest<Q, B>, res: NextApiResponse) => void | Promise<void>;

export type ExamQuery = {
  id: string;
};

export function withExamSession<
  Q extends ExamQuery = ExamQuery,
  B extends Query = {}
>(handler: ExamApiHandler<Q, B>, options: APIOptions<Q, B>) {
  return withAPISession((req, res) => {
    if (options.noCache) {
      res.setHeader("Expires", "Thu, 01 Jan 1970 00:00:00 GMT");
      res.setHeader(
        "Cache-Control",
        "no-cache, no-store, max-age=0, must-revalidate"
      );
    }
    if (
      typeof req.query.id !== "string" ||
      !(options.verifyBody ? options.verifyBody(req.body) : true) ||
      !(options.verifyQuery
        ? options.verifyQuery(req.query as ExamQuery)
        : true)
    ) {
      return void res.status(400).end();
    }
    const examData = req.session.exam?.[req.query.id];
    if (!examData?.hash || !examData?.startTime) {
      // Hash not exists. Malformed request.
      res.status(403).end();
      return;
    }

    const endTime = req.session.exam?.[req.query.id]?.endTime;
    const currentTime = dayjs();
    if (
      typeof endTime === "number" &&
      !options.noTimeCheck &&
      currentTime.isAfter(endTime)
    ) {
      // Time is end. Cannot allow to continue the exam.
      return void res.status(402).end();
    }

    (req as ExamAPIRequest).examData = examData;
    /**
     * Sets the HTTP status code and optionally, set the exam time header
     * if the current exam time is valid.
     */
    const status: NextApiResponse["status"] = (statusCode: number) => {
      if (statusCode === 200 && endTime && !options.noTimeCheck) {
        res.setHeader("X-Exam-Time", endTime - new Date().valueOf());
      }
      return res.status(statusCode);
    };
    return handler(req as never, Object.assign({}, res, { status }));
  });
}

export * from "./withFirebase";
