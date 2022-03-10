import { GetServerSideProps } from "next";
import {
  ExamLevel,
  GenericExamModel as BaseExamModel,
  SubmissionAPIItem,
} from "@/types/exam";
import { decodeSegmentsMap, getSubmission, readFile } from "@/shared/api";
import { useState } from "react";
import { ChevronLeftIcon, PrinterIcon } from "@heroicons/react/outline";
import { useHistoryRouter } from "@/context/history";
import { ContentLoading } from "@/components/quiz/viewer";
import { useAuth } from "@/context/auth";
import Head from "next/head";
import dayjs from "@/shared/dayjs";
import {
  ExportDataGenerator,
  ExportDataOutput,
  ExportExamModel,
  Result,
} from "@/components/quiz/export";
import Image from "next/image";
import printhead from "../../../public/printhead.jpg";
import { siteName } from "@/shared/constants";

type Props = {
  results: Result[];
  submission: Pick<
    SubmissionAPIItem,
    "subject" | "level" | "id" | "score" | "total"
  > & {
    submittedTime: number;
  };
  name: string;
  admin?: boolean;
};

export const getServerSideProps: GetServerSideProps<Partial<Props>> = async (
  ctx
) => {
  try {
    const id = ctx.params?.path;
    const token = ctx.query?.token;
    if (typeof id !== "string" || typeof token !== "string") {
      throw new Error("Invalid params");
    }

    const {
      submission: { answers: _answers, hash, submittedTime, score, total },
      exam: { level, subject },
      metadata,
      tokenData: { admin },
    } = await getSubmission(token, id);
    if (!_answers) {
      return {
        notFound: true,
      };
    }
    // Sort indexes!
    const answers = Object.fromEntries(
      Object.entries(_answers).sort((a, b) =>
        a[1].index > b[1].index ? 1 : -1
      )
    );
    // Write the whole thing again for no reason.
    const map = decodeSegmentsMap(hash, answers, (key, item) => ({
      item: item as string,
      ...answers[key],
    }));

    const items = await Promise.all(
      Array.from(map.entries()).map(async ([key, entries]) => {
        let contentData: string | undefined;
        const { items, name, canShowName, content } =
          await readFile<BaseExamModel>(id as string, key, "index.json");

        if (content) {
          contentData = (
            await readFile<BaseExamModel>(id as string, key, "content.json")
          ).content;
        }
        return [
          key,
          {
            ...(contentData ? { content: contentData } : {}),
            ...((canShowName || admin) && name ? { name } : {}),
            items: entries.map((ans) => {
              const correct = items?.[ans.item].selected === ans.selected;
              const adminHtml = `<b class="text-gray-500"><span class="${
                correct ? "text-green-600" : "text-red-600"
              }">${correct ? "ถูกต้อง" : "ผิด"} (เฉลย ${
                (items?.[ans.item].selected ?? -1) + 1
              })</span> ต้นฉบับอยู่ข้อที่ ${ans.item}</b>`;

              return {
                selected: ans.selected ?? -1,
                content: items?.[ans.item]?.content ?? -1,
                ...(admin ? { adminHtml } : {}),
              };
            }),
          },
        ];
      })
    );

    // We now got results of all items.
    const itemsMap = new Map<string, Result>(items as never);
    // But we don't know any parent sections. Let's get their parents and fetch more data.
    const getParentKey = (key: string) => key.split("/").slice(0, 1);
    // Map parent keys to a set to remove duplicate values and prevent unneccesary fetches.
    const sectionsSet = new Set<string>(
      Array.from(map.keys()).map((key) => getParentKey(key).join("/"))
    );
    const sections = new Map<string, ExportExamModel>();
    await Promise.all(
      Array.from(sectionsSet.values()).map(async (key) => {
        const parentKey = getParentKey(key).join("/");
        const { name, canShowName } = await readFile<BaseExamModel>(
          id as string,
          parentKey,
          "index.json"
        );
        if (parentKey && canShowName) sections.set(parentKey, { name });
      })
    );
    // Finally, combine both parents and childrens
    const results = new Map();
    itemsMap.forEach((value, key) => {
      const parentKey = getParentKey(key);
      for (let i = 0; i < parentKey.length; i++) {
        const sectionKey = parentKey.slice(0, i + 1).join("/");
        if (!results.has(sectionKey) && sections.has(sectionKey))
          results.set(sectionKey, sections.get(sectionKey));
      }
      results.set(key, value);
    });

    return {
      props: {
        results: Array.from(results.values()),
        submission: {
          id,
          subject,
          level,
          score,
          total,
          submittedTime: submittedTime.valueOf(),
        },
        name: metadata.nameTitle + metadata.name,
        ...(admin ? { admin } : {}),
      },
    };
  } catch (err) {
    return {
      props: {},
      redirect: {
        destination: "/home",
      },
    };
  }
};

export default function PrintPage({ results, submission, name, admin }: Props) {
  const { metadata } = useAuth();
  const [output, setOutput] = useState<Result[]>();
  const { back } = useHistoryRouter();

  return (
    <main className="flex flex-col print min-h-screen">
      <Head>
        <title>
          {output ? "สำเนาข้อสอบ" : "กำลังโหลด..."} ({submission.subject} -{" "}
          {ExamLevel[submission.level]})
        </title>
      </Head>
      <header className="p-6 font-prompt sticky top-0 bg-quiz-orange-500 text-white shadow z-10 ">
        <div className="flex flex-row gap-2 flex-grow items-center">
          {!admin && output && (
            <button onClick={() => back(`/exam/${submission.id}/report`)}>
              <ChevronLeftIcon className="h-6 w-6" />
            </button>
          )}
          <h1 className="font-bold text-lg flex-grow">สำเนาข้อสอบ</h1>
          {output && (
            <button
              title="พิมพ์"
              onClick={() => {
                window.print();
              }}
              className="px-4 py-2 flex flex-wrap justify-center items-center gap-2 rounded-lg bg-quiz-blue-400 text-white hover:bg-quiz-blue-500"
            >
              <PrinterIcon className="h-5 w-5 flex-shrink-0" />
              <span className="text-sm">พิมพ์</span>
            </button>
          )}
        </div>
      </header>
      {!(output && submission) ? (
        <>
          <div className="flex flex-col font-prompt items-center justify-center flex-grow h-full">
            <ContentLoading />
            <span>กำลังจัดเตรียมไฟล์ กรุณารอสักครู่...</span>
          </div>
          {metadata?.exists && (
            <ExportDataGenerator hide results={results} onSuccess={setOutput} />
          )}
        </>
      ) : (
        <div className="flex-grow flex flex-col items-center p-4 md:p-8 lg:p-12 bg-gray-400 print:p-0 print:bg-white">
          <article className="font-sarabun content bg-white p-10 lg:p-14 print:p-0 max-w-5xl print:max-w-none">
            <div>
              <Image
                src={printhead}
                alt={"โครงการ" + siteName}
                className="border border-gray-400"
              />
            </div>
            <div className="flex flex-row gap-4 items-start pt-4">
              <div className="flex flex-grow flex-col gap-4">
                <h1 className="flex-grow text-quiz-blue-600">
                  {submission.subject} - {ExamLevel[submission.level]}
                </h1>
                <div className="form-container">
                  <b>ชื่อผู้ทำแบบทดสอบ:</b>
                  <span>{name}</span>
                  <b>เวลาที่ส่งแบบทดสอบ:</b>
                  <span>
                    {dayjs(submission.submittedTime).format("LLL")} น.
                  </span>
                </div>
              </div>
              <div className="rounded font-bold text-lg  bg-quiz-blue-400 px-4 py-2 text-white">
                {submission.score} / {submission.total}
              </div>
            </div>
            <ExportDataOutput results={output} />
            <hr />
            <p className="text-gray-500 text-sm">
              สงวนลิขสิทธิ์ 2564-2565 คณะกรรมการนักเรียน ปีการศึกษา 2564
            </p>
          </article>
        </div>
      )}
    </main>
  );
}
