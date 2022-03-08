import { QuizItemState, quizItemStore } from "@/shared/store";
import { useEffect, useRef, useState } from "react";
import Editor from "../editor";
import { markdown } from "../markdown";
import { Result } from "./types";

const delay = (time: number) =>
  new Promise<void>((resolve) => setTimeout(() => resolve(), time));

export function ExportDataGenerator({
  hide,
  results,
  onSuccess,
}: {
  hide?: boolean;
  results: Result[];
  onSuccess: (data: Result[]) => void;
}) {
  const [ready, setReady] = useState(false);
  const editorRef = useRef<Editor | null>();
  const dataRef = useRef<Result[]>();
  const isProcessing = useRef(false);

  useEffect(() => {
    if (!ready || isProcessing.current || dataRef.current) return;

    const html = async (item: QuizItemState) => {
      // Set internal state first
      quizItemStore.setState(item);
      await delay(50);
      editorRef.current?.setContent(item.content);
      if (item.selected && item.selected !== -1)
        editorRef.current?.setAnswerValue(item.selected);
      await delay(50);
      return markdown(editorRef.current?.getHTML() ?? "");
    };

    console.log(results);
    (async () => {
      isProcessing.current = true;
      dataRef.current = results.slice() as any;
      let item = 1;
      for (let i = 0; i < results.length; i++) {
        if (dataRef.current![i].content) {
          dataRef.current![i].content = await html({
            content: dataRef.current![i].content ?? "",
            selected: -1,
            item,
            startIndex: item - 1,
          });
        }
        if (results[i].items) {
          for (let e = 0; e < results[i].items.length; e++) {
            // There's sometimes a bug that caused an item not to displayed properly
            // when items are placed in the root section, let it be.
            dataRef.current![i].items[e].index = item;
            dataRef.current![i].items[e].content =
              (await html({ ...results[i].items[e], item })) ?? "";
            item++;
          }
        }
      }
      setReady(false);
      onSuccess(dataRef.current ?? []);
    })();
  }, [onSuccess, ready, results]);

  return (
    <div className={hide ? "hidden" : undefined}>
      <Editor
        ref={(ref) => (editorRef.current = ref)}
        onReady={() => setReady(true)}
      />
    </div>
  );
}
