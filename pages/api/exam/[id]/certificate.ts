import PDFDocument from "pdfkit";
import { NextApiHandler } from "next";
import { nanoid } from "nanoid";
import { siteName } from "@/shared/constants";
import { thaiDigits } from "@/shared/thaiHelpers";
import { getSubmission } from "@/shared/api";
import statics from "../../../../statics/index.json";

const file = (name: string) => {
  const buffer = Buffer.from((statics as any)[name]);
  return buffer;
};

const certificate: NextApiHandler = async (req, res) => {
  try {
    const id = req.query?.id;
    const token = req.query?.token;
    if (typeof id !== "string" || typeof token !== "string") {
      throw new Error("Invalid params");
    }

    const doc = new PDFDocument({
      pdfVersion: "1.4",
      layout: "landscape",
      size: "A4",
      // Make it random means we (as a pdf creator) couldn't modify the PDF too!
      ownerPassword: nanoid(),
      permissions: {
        printing: "highResolution",
        annotating: false,
        copying: false,
        modifying: false,
      },
      margin: 0,
      info: {
        Title: "เกียรติบัตรโครงการ" + siteName,
        Author: "คณะกรรมการนักเรียน ปีการศึกษา 2564",
        CreationDate: new Date(),
        ModDate: new Date(),
        Creator: "Lemasc QuizManager",
        Producer: "Lemasc PDF Creator",
      },
      displayTitle: true,
    });

    const {
      submission: { score, total, submittedTime },
      exam: { subject },
      metadata,
    } = await getSubmission(token, id);

    doc.registerFont("Regular", file("THSarabunNew"));
    doc.registerFont("Bold", file("THSarabunNewBold"));

    doc.image(file("cert"), 0, 0, {
      width: Math.ceil(doc.page.width),
      height: Math.ceil(doc.page.height),
    });

    doc
      .font("Bold")
      .fontSize(32)
      .text(`${metadata.nameTitle}${metadata.name}`, 0, 221, {
        align: "center",
      });
    doc.font("Bold").fontSize(22).text(subject, 583, 259);

    doc
      .font("Regular")
      .fontSize(22)
      .text(thaiDigits(submittedTime.getDate()), -11, 330, {
        align: "center",
      });

    doc
      .font("Regular")
      .fontSize(19)
      .text(thaiDigits(((score * 100) / total).toFixed(2)), 542, 297);

    doc.end();
    res.setHeader("Content-Transfer-Encoding", "Binary");
    res.setHeader(
      "Content-disposition",
      `attachment; filename=QuizCert_${metadata.studentId}_${id}.pdf`
    );
    doc.pipe(res);
  } catch (err) {
    console.error(err);
    res.status(500).end();
  }
};

export default certificate;
