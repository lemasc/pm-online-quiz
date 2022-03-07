import { GetServerSideProps, InferGetServerSidePropsType } from "next";
import fs from "fs/promises";
import {
  ExamSubmission,
  GenericExamModel as BaseExamModel,
} from "@/types/exam";
import { withSession } from "@/shared/session";
import { decodeSegmentsMap, readFile } from "@/shared/api";
import { QuizItem } from "../types";
import { Component, useEffect, useRef, useState } from "react";
import Editor from "@/components/quiz/editor";
import sanitize from "sanitize-html";
import { markdown } from "@/components/quiz/markdown";

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
  results: Result[];
};

export const getServerSideProps: GetServerSideProps = withSession<Props>(
  async (ctx) => {
    const id = "ziNsS2YSSNe7Cq2KFYTGj";
    const { answers: _answers, hash } = JSON.parse(
      await fs.readFile(`${id}.json`, {
        encoding: "utf-8",
      })
    ) as ExamSubmission;
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

    console.time("Items");
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
              // TODO: Use their selected answers, not our answer key!! (Replace with ans.selected)
              selected: items?.[ans.item]?.selected ?? -1,
              content: items?.[ans.item]?.content ?? "",
              index: ans.index,
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
      },
    };
  }
);

const delay = (time: number) =>
  new Promise<void>((resolve) => setTimeout(() => resolve(), time));

export default function Page({ results }: Props) {
  const [capture, setCapture] = useState(false);
  const [ready, setReady] = useState(false);
  const editorRef = useRef<Editor | null>();
  const isProcessing = useRef(false);
  const dataRef = useRef<ProcessedResult[]>();

  const process = (html?: string) =>
    sanitize(html ?? "", {
      allowedTags: [
        "div",
        "p",
        "em",
        "strong",
        "br",
        "form",
        "input",
        "center",
        "u",
      ],
      allowedAttributes: {
        "*": ["class", "style"],
        input: ["type", "name", "value", "checked", "data-selected"],
      },
      exclusiveFilter: function (frame) {
        return (
          frame.tag === "br" &&
          frame.attribs.class == "ProseMirror-trailingBreak"
        );
      },
    });

  useEffect(() => {
    if (!capture || isProcessing.current) return;

    const html = async (item: QuizItem) => {
      editorRef.current?.setContent(item.content);
      if (item.selected && item.selected !== -1)
        editorRef.current?.setAnswerValue(item.selected);
      await delay(100);
      return markdown(editorRef.current?.getHTML() ?? "");
    };

    (async () => {
      isProcessing.current = true;
      console.time("Process");
      dataRef.current = results.slice() as any;
      for (let i = 0; i < results.length; i++) {
        if (dataRef.current![i].content) {
          dataRef.current![i].content = await html({
            content: dataRef.current![i].content ?? "",
            selected: -1,
          });
        }
        if (results[i].items) {
          for (let e = 0; e < results[i].items.length; e++) {
            dataRef.current![i].items[e] =
              (await html(results[i].items[e])) ?? "";
          }
        }
      }
      console.timeEnd("Process");
      console.log("RESULTS", results);
      console.log("data", dataRef.current);
      setCapture(false);
      setReady(true);
    })();
  }, [capture, results]);

  return (
    <div>
      <h1>Hey Ho</h1>
      {!ready ? (
        <div>
          <Editor
            ref={(ref) => (editorRef.current = ref)}
            onReady={() => setCapture(true)}
          />
        </div>
      ) : (
        <div className="font-sarabun print-preview">
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
                      __html: process(result.content),
                    }}
                  ></div>
                )}
                {result.items &&
                  result.items.map((v, i) => (
                    <div
                      key={i}
                      dangerouslySetInnerHTML={{ __html: process(v) }}
                    ></div>
                  ))}
              </>
            );
          })}
        </div>
      )}
    </div>
  );
}
