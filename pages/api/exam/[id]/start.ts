import { NextApiHandler } from "next";

import { ExamStartPayload, GenericExamModel } from "@/types/exam";
import { nanoid } from "nanoid";
import { withAPISession } from "@/shared/session";
import dayjs from "dayjs";
import { readFile, withFirebase } from "@/shared/api";

/**
 * Shuffle Array
 *
 * https://stackoverflow.com/a/12646864
 */
function shuffleArray<T>(arr: T[]): T[] {
  const array = arr.slice();
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

const handler: NextApiHandler<ExamStartPayload> = async (req, res) => {
  res.setHeader("Expires", "Thu, 01 Jan 1970 00:00:00 GMT");
  res.setHeader(
    "Cache-Control",
    "no-cache, no-store, max-age=0, must-revalidate"
  );

  const hashes = new Map<string, string>();
  const contentSections: string[] = [];

  let rootExamData: GenericExamModel | undefined;

  const getOrGenerateHash = (id: string) => {
    if (hashes.has(id)) return hashes.get(id) as string;
    const hash = nanoid(4);
    hashes.set(id, hash);
    return hash;
  };

  const processSection = async (...segments: string[]): Promise<string[]> => {
    let items: Array<string[] | string> = [];
    const segmentsAsHashes = segments.slice(1).map((s) => getOrGenerateHash(s));
    // 1. Read Index File and append to items array
    const root = await readFile<GenericExamModel>(...segments, "index.json");
    if (segments.length === 1) rootExamData = root;
    if (root.items) {
      items = [
        ...items,
        ...Object.keys(root.items).map((c) => [
          ...segmentsAsHashes,
          // Instead of using numbers, we convert to letters to make it looks like a wtf code.
          String.fromCharCode(64 + parseInt(c)),
        ]),
      ];
    }

    // 2. Read Sections File and append as string placeholder
    const sections: string[] = await readFile(...segments, "sections.json");

    // EXTRA: If the current section contains the content field, add it to our array
    if (Boolean(root.content)) {
      contentSections.push(segmentsAsHashes.join("~"));
    }

    items = [...items, ...sections];
    // 3. Check if root section needs random
    if (root.allowRandom) items = shuffleArray(items);
    // 4. Recursively check items for section placeholder and shuffle the subsection items.
    return await Promise.all(
      items.map(async (c) => {
        if (Array.isArray(c)) {
          // This is the complete hash, join strings using the seperator.
          return c.join("~");
        }
        return processSection(...segments, c);
      })
    ).then((arr) => arr.flat());
  };

  if (req.method !== "GET" || typeof req.query.id !== "string") {
    res.status(400).send({ data: [] });
    return;
  }
  try {
    const data = await processSection(req.query.id);
    // Max internet delay 1500ms
    const startTime = dayjs().add(1500, "milliseconds");
    req.session.uid = req.token.uid;
    req.session.exam = {
      ...(req.session.exam || {}),
      [req.query.id]: {
        // Hashes must be stored in the cookie only, as it is the only way to decrypted data.
        // If the user lost the cookie they must redone the whole process.
        hash: Object.fromEntries(
          Array.from(hashes.entries()).map((h) => h.reverse())
        ),
        startTime: startTime.valueOf(),
        endTime: rootExamData?.time
          ? startTime.add(rootExamData.time, "minutes").valueOf()
          : undefined,
      },
    };
    await req.session.save();
    res.status(200).json({
      // Data is an obfuscated exam payload that can be send to the client safely.
      data,
      content: contentSections,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ data: [] });
  }
};

export default withFirebase(withAPISession(handler));
