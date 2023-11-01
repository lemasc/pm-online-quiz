import {
  DocumentData,
  DocumentSnapshot,
  QueryDocumentSnapshot,
} from "firebase-admin/firestore";
import admin from "../firebase-admin";

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

const segmentsToFirestorePath = (...segments: string[]) => {
  const targetFile = segments.pop() as string;

  let path = "exam-demo";
  if (segments.length === 0) return path;
  // Join segments with /sections/ in between, except for the last segment
  for (let i = 0; i < segments.length; i++) {
    path += "/" + segments[i];
    if (segments[i + 1]) {
      path += "/sections";
    }
  }
  if (targetFile === "sections.json") {
    path += "/sections";
  }
  return path;
};

const db = admin.firestore();

const dataWithId = (record: QueryDocumentSnapshot | DocumentSnapshot) => {
  const data = record.data();
  return {
    ...data,
    id: record.id,
  };
};

export const readFile = async <T = any>(...segments: string[]): Promise<T> => {
  /*return JSON.parse(
      await fs.readFile(path.join("../pm-online-quiz-data", ...segments), {
        encoding: "utf-8",
      })
    );*/

  console.log("S", segments);
  if (segments[0] === "index.json") {
    return db
      .collection("exam-demo")
      .get()
      .then(({ docs }) => docs.map(dataWithId)) as any;
  }

  const path = segmentsToFirestorePath(...segments);
  console.log("P", path);
  if (path.endsWith("sections")) {
    return db
      .collection(path)
      .get()
      .then(({ docs }) => docs.map(({ id }) => id)) as any;
  }
  return db.doc(path).get().then(dataWithId) as any;
};
