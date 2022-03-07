import path from "path";
import axios from "axios";
import fs from "fs/promises";
import { DocumentData } from "firebase-admin/firestore";

export function withDocumentDatesParsed<Data extends DocumentData>(
  data: Data,
  parseDates?: (keyof Data)[]
): Data {
  const doc = { ...data };
  parseDates?.forEach((dateField) => {
    if (typeof dateField !== "string") return;

    const unparsedDate = doc[dateField];
    if (unparsedDate) {
      const parsedDate: Date | undefined = unparsedDate.toDate?.();
      if (parsedDate) {
        (doc as any)[dateField] = parsedDate;
      }
    }
  });

  return doc;
}

export const readFile = async <T = any>(...segments: string[]): Promise<T> => {
  /*return JSON.parse(
      await fs.readFile(path.join("../pm-online-quiz-data", ...segments), {
        encoding: "utf-8",
      })
    );*/
  return axios
    .get<T>(`/${segments.join("/")}`, {
      baseURL: process.env.DATA_URL,
    })
    .then((v) => v.data);
};
