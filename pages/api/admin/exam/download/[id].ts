import { NextApiHandler } from "next";
import AdmZip from "adm-zip";
import { getFirestore, DocumentSnapshot } from "firebase-admin/firestore";
import admin from "@/shared/firebase-admin";
const db = getFirestore(admin);

const joinSegments = (...segments: string[]) => segments.join("/sections/");

const addData = async (zip: AdmZip, snapshot: DocumentSnapshot) => {
  const ref = snapshot.ref;
  const segments = ref.path.replaceAll("/sections/", "/");

  if (snapshot.exists) {
    const json: Record<string, unknown> = {
      id: snapshot.id,
      ...(snapshot.data() || {}),
    };
    // Content field should be added in the different file.

    if (json.content) {
      zip.addFile(
        `${segments}/content.json`,
        Buffer.from(JSON.stringify({ content: json.content }), "utf-8")
      );
      // Replace content field with only `1`, so we know that there's an extra content to fetch.
      json.content = 1;
    }

    zip.addFile(
      `${segments}/index.json`,
      Buffer.from(JSON.stringify(json), "utf-8")
    );

    const { docs } = await ref.collection("sections").orderBy("name").get();
    const sections = await Promise.all(docs.map((doc) => addData(zip, doc)));
    zip.addFile(
      `${segments}/sections.json`,
      Buffer.from(JSON.stringify(sections), "utf-8")
    );
  }
  return snapshot.id;
};

const handler: NextApiHandler = async (req, res) => {
  if (req.method !== "GET" || !req.query.id) {
    res.status(400).send({ success: false });
    return;
  }
  const id = req.query.id as string;
  const zip = new AdmZip();
  try {
    // Read the current section data, add JSON as index file.
    const snapshot = await db.doc(`exam/${joinSegments(id)}`).get();
    await addData(zip, snapshot);
    res.setHeader("Content-Transfer-Encoding", "Binary");
    res.setHeader("Content-type", "application/zip");
    res.setHeader(
      "Content-disposition",
      `attachment; filename=ExamExport_${id}.zip`
    );
    res.send(zip.toBuffer());
  } catch (err) {
    console.error(err);
    res.status(500).send({ success: false });
  }
};

export default handler;
