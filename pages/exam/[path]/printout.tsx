import { GetServerSideProps } from "next";
import { ExamLevel, GenericExamModel as BaseExamModel } from "@/types/exam";
import { decodeSegmentsMap, getSubmission, readFile } from "@/shared/api";
import { QuizItem } from "../../../types";
import { useEffect, useRef, useState } from "react";
import Editor from "@/components/quiz/editor";
import { markdown } from "@/components/quiz/markdown";
import { QuizItemState, quizItemStore } from "@/shared/store";
import { ChevronLeftIcon, PrinterIcon } from "@heroicons/react/outline";
import { useHistoryRouter } from "@/context/history";
import { ContentLoading } from "@/components/quiz/viewer";
import { useExamList } from "@/shared/examList";
import { useAuth } from "@/context/auth";

type Answer = {
  item: string;
  index: number;
  selected: number;
};

type GenericExamModel = Partial<Pick<BaseExamModel, "content" | "name">>;

type Result = GenericExamModel & {
  items: (QuizItem & Omit<Answer, "item">)[];
};

type ProcessedResult = Omit<Result, "items"> & {
  items: string[];
};

type Props = {
  path: string;
  results: Result[];
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
      data: { answers: _answers, hash },
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
        let contentData: string | undefined = "";
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
            ...(canShowName ? { name } : {}),
            items: entries.map((ans) => ({
              selected: ans.selected ?? -1,
              content: `**${ans.index + 1}.**\n${items?.[ans.item]?.content}`,
            })),
          },
        ];
      })
    );

    // We now got results of all items.
    const itemsMap = new Map<string, Result>(items as never);
    // But we don't know any parent sections. Let's get their parents and fetch more data.
    const getParentKey = (key: string) => key.split("/").slice(0, 1);
    // Map parent keys to a set to remove duplicate values
    const sectionsSet = new Set<string>(
      Array.from(map.keys()).map((key) => getParentKey(key).join("/"))
    );
    const sections = new Map<string, GenericExamModel>();
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
        path: id,
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

const delay = (time: number) =>
  new Promise<void>((resolve) => setTimeout(() => resolve(), time));

export default function PrintPage({ results, path }: Props) {
  const { metadata } = useAuth();
  const { data } = useExamList();
  const [capture, setCapture] = useState(false);
  const [ready, setReady] = useState(false);
  const editorRef = useRef<Editor | null>();
  const isProcessing = useRef(false);
  const dataRef = useRef<ProcessedResult[]>();
  const { back } = useHistoryRouter();

  useEffect(() => {
    if (!capture || isProcessing.current || dataRef.current) return;

    const html = async (item: QuizItemState) => {
      // Set internal state first
      quizItemStore.setState(item);
      await delay(100);
      editorRef.current?.setContent(item.content);
      if (item.selected && item.selected !== -1)
        editorRef.current?.setAnswerValue(item.selected);
      await delay(100);
      return markdown(editorRef.current?.getHTML() ?? "");
    };

    (async () => {
      isProcessing.current = true;
      dataRef.current = results.slice() as any;
      let item = 0;
      for (let i = 0; i < results.length; i++) {
        if (dataRef.current![i].content) {
          dataRef.current![i].content = await html({
            content: dataRef.current![i].content ?? "",
            selected: -1,
            item,
            startIndex: item,
          });
        }
        if (results[i].items) {
          for (let e = 0; e < results[i].items.length; e++) {
            dataRef.current![i].items[e] =
              (await html({ ...results[i].items[e], item })) ?? "";
            item++;
          }
        }
      }
      setCapture(false);
      setReady(true);
    })();
  }, [capture, results]);

  const submission = data ? data.submission[path] : undefined;

  return (
    <main className="flex flex-col print min-h-screen">
      <header className="p-6 font-prompt sticky top-0 bg-quiz-orange-500 text-white shadow z-10 ">
        <div className="flex flex-row gap-2 flex-grow items-center">
          {ready && (
            <button onClick={() => back(`/exam/${path}/report`)}>
              <ChevronLeftIcon className="h-6 w-6" />
            </button>
          )}
          <h1 className="font-bold text-lg flex-grow">สำเนาข้อสอบ</h1>
          {ready && (
            <button
              title="ออกจากระบบ"
              onClick={() => {
                console.log("Print");
                window.print();
              }}
              className="px-4 py-2 flex flex-wrap justify-center items-center gap-2 rounded-lg bg-quiz-blue-500 text-white hover:bg-quiz-blue-600"
            >
              <PrinterIcon className="h-5 w-5 flex-shrink-0" />
              <span className="text-sm">พิมพ์</span>
            </button>
          )}
        </div>
      </header>
      {!(ready && submission) ? (
        <>
          <div className="flex flex-col font-prompt items-center justify-center flex-grow h-full">
            <ContentLoading />
            <span>กำลังจัดเตรียมไฟล์ กรุณารอสักครู่...</span>
          </div>
          {metadata?.exists && (
            <div className="hidden">
              <Editor
                ref={(ref) => (editorRef.current = ref)}
                onReady={() => setCapture(true)}
              />
            </div>
          )}
        </>
      ) : (
        <div className="flex-grow p-4 md:p-8 lg:p-12 bg-gray-400 print:p-0 print:bg-white">
          <article className="font-sarabun content bg-white p-10 lg:p-14 print:p-0">
            <div className="flex flex-row gap-4 items-center pt-8">
              <h1 className="flex-grow">
                {submission.subject} - {ExamLevel[submission.level]}
              </h1>
              <div className="rounded font-bold text-lg bg-quiz-blue-400 px-4 py-2 text-white">
                {submission.score} / {submission.total}
              </div>
            </div>
            {dataRef.current?.map((result) => {
              let name: JSX.Element | undefined;
              if (result.name) {
                const Tag: keyof JSX.IntrinsicElements = result.items
                  ? "h3"
                  : "h2";
                name = <Tag key={`name_${result.name}`}>{result.name}</Tag>;
              }
              return (
                <>
                  {name}
                  {result.content && (
                    <div
                      dangerouslySetInnerHTML={{
                        __html: result.content,
                      }}
                    ></div>
                  )}
                  {result.items &&
                    result.items.map((v, i) => (
                      <div
                        key={i}
                        dangerouslySetInnerHTML={{ __html: v }}
                      ></div>
                    ))}
                </>
              );
            })}
          </article>
        </div>
      )}
    </main>
  );
}
