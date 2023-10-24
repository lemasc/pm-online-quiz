import Viewer, { ViewerClass } from "@/components/quiz/viewer";
import { CONTENT_INDEX } from "@/shared/constants";
import { useExamQuery } from "@/shared/exam";
import {
  quizItemStore,
  quizStore,
  setIndex,
  setItems,
  useQuizStoreSync,
} from "@/shared/store";
import { QuizModel } from "@/types/index";
import {
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  RefreshIcon,
} from "@heroicons/react/outline";
import { NextPage } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import { useDocument } from "swr-firestore-v9";

const Page: NextPage = () => {
  const editorRef = useRef<ViewerClass>();
  const routerTimeout = useRef<NodeJS.Timeout>();

  const router = useRouter();
  const { size, index } = useQuizStoreSync();
  const { basePath, goNext, goPrevious } = useExamQuery();
  const [answers, setAnswers] = useState<Map<number, number>>(new Map());
  const [updateTime, setUpdateTime] = useState<Date | undefined>();

  const { data } = useDocument<QuizModel>(
    basePath ? `/exam-demo/${basePath}` : null,
    {
      listen: true,
    }
  );

  useEffect(() => {
    if (!data) return;
    setUpdateTime(new Date());
    if (data.exists) {
      setItems(() => {
        const map = new Map(
          Object.entries(data.items).map(([k, v]) => [
            parseInt(k),
            { ...v, selected: -1 },
          ])
        );
        if (data.content)
          map.set(CONTENT_INDEX, { content: data.content, selected: -1 });
        return map;
      });
      setAnswers(
        () =>
          new Map(
            Object.entries(data.items)
              .map(([k, v]) => [parseInt(k), v.selected])
              .filter(([k, v]) => k !== CONTENT_INDEX) as never
          )
      );
    }
  }, [data]);

  useEffect(() => {
    if (routerTimeout.current) clearTimeout(routerTimeout.current);
    routerTimeout.current = setTimeout(() => {
      if (!router.query.path) {
        router.replace("/admin/exam");
      } else if (index === 0) {
        setIndex(() => 1);
      } else {
        const item = parseInt(router.query.item as string);
        if (!isNaN(item)) setIndex(() => item);
      }
      routerTimeout.current = undefined;
    }, 200);
  }, [router, index]);

  const resetAnswer = () => {
    quizItemStore.setState({ selected: -1 });
  };

  const submit = () => {
    const items = Array.from(quizStore.getState().items.entries());
    let unansweredItems = 0;
    const results = items
      .map(([key, value]) => {
        if (key !== CONTENT_INDEX && value.selected === -1) unansweredItems++;
        return value.selected === answers.get(key);
      })
      .reduce((prev, cur) => prev + Number(cur), 0);
    if (
      !confirm(
        `Are you sure you want to submit?${
          unansweredItems !== 0
            ? `\nWarning: You got ${unansweredItems} items answered.`
            : ""
        }`
      )
    )
      return;
    alert(`You got ${results} out of ${size}.`);
  };

  const renderContent = () => {
    const contentItem = quizStore.getState().items.get(CONTENT_INDEX);
    if (contentItem) {
      const state = {
        ...contentItem,
        item: -2,
      };
      return <ViewerClass state={state} />;
    }
    return null;
  };
  return (
    <>
      <Head>
        <title>Preview (Item {index}) : LQM Editor</title>
      </Head>
      <div className="min-h-screen h-full flex flex-col">
        <div className="p-4 flex flex-row gap-4 items-center">
          <h1 className="font-bold text-lg">Viewer</h1>
          <span className="flex-grow">
            Question {index} of {size}
          </span>
          {updateTime && (
            <span className="text-sm text-gray-500">
              Last updated at {updateTime.toLocaleString()}
            </span>
          )}
        </div>
        <div className="flex-grow border-t p-4 w-full flex flex-col items-center">
          <div className="flex flex-col flex-1 w-full items-center ">
            <div className="flex flex-1 items-center flex-col w-full max-w-2xl">
              <div className="flex-1 flex flex-col w-full">
                {renderContent()}
                <Viewer
                  ref={(ref) => (editorRef.current = ref as ViewerClass)}
                />
              </div>
              <div className="grid grid-cols-2 w-full gap-4 text-white text-sm py-4">
                <div>
                  {index > 1 && (
                    <button
                      title="Previous"
                      className="control-btn bg-blue-500 hover:bg-blue-600"
                      onClick={() => goPrevious()}
                    >
                      <ChevronLeftIcon />
                      <span className="mr-2">Previous</span>
                    </button>
                  )}
                </div>
                <div className="flex flex-row gap-4 justify-end">
                  <button
                    title="Reset Answer"
                    className="control-btn text-gray-900 bg-gray-200 hover:bg-gray-300"
                    onClick={() => resetAnswer()}
                  >
                    <RefreshIcon />
                    <span>Reset Answer</span>
                  </button>
                  {index < size ? (
                    <button
                      title="Next"
                      className="control-btn bg-blue-500 hover:bg-blue-600 md:w-28"
                      onClick={() => goNext()}
                    >
                      <ChevronRightIcon />
                      <span className="mr-2">Next</span>
                    </button>
                  ) : (
                    <button
                      title="Submit"
                      className="control-btn bg-green-500 hover:bg-green-600 md:w-28"
                      onClick={() => submit()}
                    >
                      <CheckIcon />
                      <span className="mr-2">Submit</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-col border-t p-4 w-full bg-gray-100 text-sm">
          <span>Copyright &copy; 2021-2022 Lemasc QuizManager</span>
        </div>
      </div>
    </>
  );
};

export default Page;
