import { NextPage } from "next";
import Editor from "@/components/quiz/editor";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  EyeIcon,
  TrashIcon,
} from "@heroicons/react/outline";
import { useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { QuizItem, QuizModel } from "@/types/index";
import { useDocument, updateDoc } from "swr-firestore-v9";
import {
  quizStore,
  setIndex,
  setItems,
  useQuizStoreSync,
} from "@/shared/store";
import { useExamQuery } from "@/shared/exam";
import Head from "next/head";
import { CONTENT_INDEX } from "@/shared/constants";
import { useHistoryRouter } from "@/context/history";

const Page: NextPage = () => {
  const editorRef = useRef<Editor>();
  const routerTimeout = useRef<NodeJS.Timeout>();
  const touchedTimeout = useRef<NodeJS.Timeout>();
  const previewWindow = useRef<Window | null>();

  const router = useRouter();
  const { back } = useHistoryRouter();
  const { size, index } = useQuizStoreSync();
  const { basePath, shallowReplace, goNext, goPrevious } = useExamQuery();

  const { data } = useDocument<QuizModel>(
    basePath ? `/exam/${basePath}` : null,
    {
      listen: true,
    }
  );

  useEffect(() => {
    if (!data) return;
    if (data.exists && data.items) {
      const existingState = quizStore.getState().currentItem;
      if (data.items[existingState]) {
        // Editor never renders again. This is very bad practice but we need to explictly set it.
        editorRef.current?.setContent(data.items[existingState].content);
        editorRef.current?.setAnswerValue(data.items[existingState].selected);
      }
      setItems(() => {
        const map = new Map(
          Object.entries(data.items).map(([k, v]) => [parseInt(k), v])
        );
        if (data.content)
          map.set(CONTENT_INDEX, { content: data.content, selected: -1 });
        return map;
      });
    }
  }, [data]);

  useEffect(() => {
    if (!data) return;
    if (routerTimeout.current) clearTimeout(routerTimeout.current);
    routerTimeout.current = setTimeout(() => {
      if (!router.query.path || !data.exists) {
        router.replace("/admin/exam/");
      } else if (!router.query.item) {
        shallowReplace(1);
      } else {
        const id = router.query.item && parseInt(router.query.item as string);
        if (id && !isNaN(id) && id !== CONTENT_INDEX) {
          setItems((items) => {
            for (let i = 1; i <= id; i++) {
              if (!items.has(i)) {
                items.set(i, { content: "", selected: -1 });
              }
            }
            return items;
          });
          setIndex((index) => (index === CONTENT_INDEX ? CONTENT_INDEX : id));
        }
      }
      routerTimeout.current = undefined;
    }, 200);
  }, [router, shallowReplace, data]);

  const saveToDb = useCallback(() => {
    // Items must be declared outside of the setTimeout scope.
    const items = quizStore.getState().items;
    if (touchedTimeout.current) clearTimeout(touchedTimeout.current);
    touchedTimeout.current = setTimeout(() => {
      const model: QuizModel = {
        items: Object.fromEntries(
          Array.from(items.entries()).filter(
            ([k, v]) => k !== CONTENT_INDEX && v.content !== ""
          )
        ),
      };
      if (items.has(CONTENT_INDEX))
        model.content = items.get(CONTENT_INDEX)?.content;
      updateDoc(`exam/${basePath}`, model);
      localStorage.setItem("moel", JSON.stringify(model));
      console.log("Data saved at", new Date().toLocaleString());
      touchedTimeout.current = undefined;
    }, 2500);
  }, [basePath]);

  useEffect(
    () =>
      quizStore.subscribe(() => {
        saveToDb();
      }),
    [saveToDb]
  );

  const setItemForIndex = (index: number) => {
    const selectedInput = document.querySelector<HTMLInputElement>(
      `input[data-quiz="choices"]:checked`
    );
    const itemData: QuizItem = {
      content: editorRef.current?.getContent() ?? "",
      selected: selectedInput ? parseInt(selectedInput.value) : -1,
    };
    setItems((items) => {
      items.set(index, itemData);
      return items;
    });
  };

  const deleteItem = () => {
    const content = editorRef.current?.getContent();
    if (content !== "" && content !== undefined) {
      if (
        !confirm(
          `This item (${index}) contains value. Are you should you want to delete?`
        )
      )
        return;
    }

    if (index === size) {
      if (index === 1) {
        // Just reset the editor and continue.
        editorRef.current?.reset();
        setItemForIndex(1);
        return;
      }
      setIndex((index) => index - 1);
      shallowReplace(index - 1);
    }
    setTimeout(() => {
      setItems((items) => {
        const map = new Map(
          Array.from(items.entries())
            // Return all entries except the current item
            .filter(([key]) => key !== index)
            // Reindex the keys.
            .map(([key, value], index) => [index + 1, value])
        );
        return map;
      });
    });
  };

  const preview = () => {
    if (!Array.isArray(router.query.path)) return;
    const pathname = `/admin/exam/preview/${router.query.path.join("/")}`;
    try {
      if (previewWindow.current && !previewWindow.current.closed) {
        // If it's cross origin window, an error will be thrown here.
        if (location.origin === previewWindow.current.origin) {
          previewWindow.current.location.replace(pathname);
          previewWindow.current.focus();
          return;
        }
      }
    } catch {
      // Cross origin window. Don't do anything.
    }
    previewWindow.current = window.open(pathname, "_blank");
  };

  const showContent = () => {
    const state = quizStore.getState().items.get(CONTENT_INDEX);
    setIndex(() => CONTENT_INDEX);
    if (!state) {
      setItems((map) => {
        const _map = new Map(map).set(CONTENT_INDEX, {
          content: "",
          selected: -1,
        });
        return _map;
      });
    }
  };

  return (
    <>
      <Head>
        <title>
          Items Editor (
          {index === CONTENT_INDEX ? "Section Content" : `Item ${index}`}) : LQM
          Editor
        </title>
      </Head>
      <div className="min-h-screen h-full">
        <div className="p-4 flex flex-row gap-4 items-center h-20">
          <div className="flex flex-row gap-4 flex-grow items-center">
            <button
              className="flex flex-row gap-2 items-center hover:underline"
              title={"Back"}
              onClick={() =>
                back(
                  Array.isArray(router.query.path)
                    ? `/admin/exam/view/${router.query.path.join("/")}`
                    : `/admin/exam`
                )
              }
            >
              <ChevronLeftIcon className="h-6 w-6 flex-shrink-0" />
            </button>
            <h1 className="font-bold text-lg">Editor</h1>
            <span>
              {index === CONTENT_INDEX
                ? "Section Content"
                : `Question ${index} of ${size}`}
            </span>
            <div className="flex flex-grow items-center justify-center gap-4">
              <button
                className={`font-prompt hover:underline ${
                  index === CONTENT_INDEX ? "font-bold" : ""
                }`}
                onClick={() => showContent()}
              >
                Content
              </button>
              <button
                className={`font-prompt hover:underline ${
                  index !== CONTENT_INDEX ? "font-bold" : ""
                }`}
                onClick={() => {
                  const item = parseInt(router.query.item as string);
                  if (!isNaN(item)) setIndex(() => item);
                }}
              >
                Items
              </button>
            </div>
          </div>
          <div className="flex w-48 justify-end gap-3 text-white">
            {index !== CONTENT_INDEX && (
              <>
                {index > 1 && (
                  <button
                    title="Previous"
                    className="bg-blue-500 p-2 rounded"
                    onClick={() => goPrevious()}
                  >
                    <ChevronLeftIcon className="h-5 w-5" />
                  </button>
                )}
                <button
                  title="Next"
                  className="bg-blue-500 p-2 rounded"
                  onClick={() => goNext()}
                >
                  <ChevronRightIcon className="h-5 w-5" />
                </button>{" "}
                <button
                  title="Remove"
                  className="bg-red-500 p-2 rounded"
                  onClick={() => deleteItem()}
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </>
            )}
            <button
              onClick={() => preview()}
              title="Preview"
              className="bg-green-500 p-2 rounded"
            >
              <EyeIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div>
          <Editor ref={(ref) => (editorRef.current = ref as Editor)} />
        </div>
      </div>
    </>
  );
};

export default Page;
