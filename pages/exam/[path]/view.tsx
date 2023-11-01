import Scrollable from "@/components/Scrollable";
import Container, { Navbar, withExamName } from "@/components/container";
import Viewer, {
  ContentLoading,
  ContentViewer,
  Timer,
  ViewerClass,
} from "@/components/quiz/viewer";
import { CONTENT_INDEX } from "@/shared/constants";
import { useExamQuery } from "@/shared/exam";
import {
  QuizState,
  quizItemStore,
  quizStore,
  setIndex,
  setItems,
  useQuizStoreSync,
} from "@/shared/store";
import { ExamLevel, ExamStartPayload, ExamSubmitBody } from "@/types/exam";
import {
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  RefreshIcon,
} from "@heroicons/react/outline";
import axios from "axios";
import { NextPage } from "next";
import { useRouter } from "next/router";
import { useCallback, useEffect, useRef, useState } from "react";

import ItemSelector from "@/components/ItemSelector";
import { useAuth } from "@/context/auth";
import { useExamList } from "@/shared/examList";
import { useRemoteExam } from "@/shared/remoteExam";
import { RemoteExamError } from "@/shared/timer";
import equal from "fast-deep-equal";
import { toast } from "react-toastify";

const toAnswers = (items: QuizState["items"]) =>
  Array.from(items.entries())
    .filter(([k, v]) => v.selected !== -1)
    .map(([k, v]) => [k, v.selected]);

const serializeToast = (error?: RemoteExamError) => {
  return `remoteExamError_${JSON.stringify(error)}`;
};

const ExamView: NextPage = () => {
  const { user, metadata } = useAuth();
  const router = useRouter();
  const { data: examList } = useExamList(true);

  const editorRef = useRef<ViewerClass>();
  const routerTimeout = useRef<NodeJS.Timeout>();
  const payload = useRef<ExamStartPayload>();

  const { index } = useQuizStoreSync();
  const { goNext, goPrevious, shallowReplace } = useExamQuery();
  const {
    item: { data },
    content: { data: contentData, isValidating },
    error,
  } = useRemoteExam({
    payload: payload.current,
  });

  // Error Handling
  const lastToastId = useRef<string>();
  useEffect(() => {
    if (serializeToast(error) !== lastToastId.current) {
      toast.dismiss(lastToastId.current);
    }
    if (!error) return;
    if (error.isTimeEnd) return;
    //if (error.isRecoverable) {
    setTimeout(
      () => {
        toast.error(
          <>
            <span className="text-red-600 text-base font-medium">
              เกิดข้อผิดพลาดในการเชื่อมต่อ
            </span>
            <br />
            <span className="text-xs">
              กำลังลองใหม่อีกครั้ง (รหัสข้อผิดพลาด {error.code})
            </span>
          </>,
          {
            bodyClassName: "pl-1 select-none",
            toastId: serializeToast(error),
            autoClose: false,
            isLoading: true,
            closeButton: false,
            draggable: false,
            closeOnClick: false,
          }
        );
        lastToastId.current = serializeToast(error);
      },

      100
    );
    // }
  }, [error]);

  // Remote Items Mapping
  useEffect(() => {
    if (!data) return;
    const items = quizStore.getState().items;
    if (items.get(index)?.content) return;
    const selected = payload.current?.answers?.[index.toString()] ?? -1;
    setItems((state) => {
      return new Map(state).set(index, { ...data, selected });
    });
    setTimeout(() => {
      editorRef.current?.setAnswerValue(selected);
    }, 200);
  }, [data, index]);

  // Router Query
  useEffect(() => {
    if (routerTimeout.current) clearTimeout(routerTimeout.current);
    routerTimeout.current = setTimeout(() => {
      try {
        if (typeof router.query.path !== "string") {
          throw new Error("No path found");
        }
        if (!payload.current) {
          // Read data from localStorage;
          const data = localStorage.getItem(`exam-${router.query.path}`);
          if (!data) throw new Error("No exam data found");
          payload.current = JSON.parse(data);

          // Restore answers from storage
          if (payload.current?.answers !== undefined) {
            setItems((map) => {
              Object.entries(payload.current?.answers ?? {}).map(([k, v]) => {
                map.set(parseInt(k), { content: "", selected: v });
              });
              return map;
            });
          }
        }
      } catch (err) {
        console.error(err);
        router.replace("/home");
        return;
      }
      if (!router.query.item) {
        shallowReplace(1);
      } else {
        const item = parseInt(router.query.item as string);
        if (!isNaN(item)) {
          setIndex(() => item);
        }
      }
      routerTimeout.current = undefined;
    }, 200);
  }, [router, index, shallowReplace]);

  // Answers autosave
  useEffect(
    () =>
      quizStore.subscribe(
        (state) => Object.fromEntries(toAnswers(state.items)),
        (answers) => {
          if (!payload.current) return;
          payload.current = {
            ...payload.current,
            answers,
          };
          localStorage.setItem(
            `exam-${router.query.path}`,
            JSON.stringify(payload.current)
          );
        },
        {
          equalityFn: equal,
        }
      ),
    [router.query.path]
  );

  const resetAnswer = useCallback(() => {
    quizItemStore.setState({ selected: -1 });
  }, []);

  const [isSubmitting, setSubmitting] = useState(false);

  const submit = useCallback(
    async (showConfirm = true) => {
      if (!user) return;
      let unansweredItems = 0;
      if (!payload.current) return;
      const answers = Object.fromEntries(
        payload.current.data.map((key, index) => {
          const selected =
            quizStore.getState().items.get(index + 1)?.selected ?? -1;
          if (selected === -1) unansweredItems++;
          return [key, { selected, index }];
        })
      );
      const body: ExamSubmitBody = {
        answers,
      };
      if (
        showConfirm &&
        !confirm(
          `คุณต้องการส่งคำตอบสำหรับข้อสอบชุดนี้หรือไม่?${
            unansweredItems !== 0
              ? `\nคำเตือน: คุณยังไม่ได้เลือกคำตอบอีก ${unansweredItems} ข้อ`
              : ""
          }`
        )
      ) {
        return;
      }
      try {
        setSubmitting(true);
        await axios.post(`/api/exam/${router.query.path}/submit`, body, {
          headers: {
            Authorization: `Bearer ${await user?.getIdToken()}`,
          },
        });
        localStorage.removeItem(`exam-${router.query.path}`);
        router.replace({
          pathname: `/exam/[path]/report`,
          query: { path: router.query.path },
        });
      } catch (err) {
        const errCode = axios.isAxiosError(err)
          ? err.response?.status ?? 0
          : -1;
        alert("ไม่สามารถส่งคำตอบได้ ข้อผิดพลาด: " + errCode);
        setSubmitting(false);
      }
    },
    [router, user, metadata?.surveyAnswered]
  );

  const getContent = useCallback(() => {
    if (!contentData) return undefined;
    return {
      ...contentData,
      startIndex: payload.current?.data.findIndex((c) =>
        c.startsWith(contentData.id)
      ),
      selected: -1,
      item: CONTENT_INDEX,
    };
  }, [contentData]);

  const Controls = ({ min }: { min?: boolean }) => (
    <div
      className={`flex flex-row w-full gap-4 text-white text-sm ${
        min ? "" : "py-4"
      }`}
    >
      <div className="flex-shrink-0">
        {index > 1 && (
          <button
            title="ข้อก่อนหน้า"
            className="control-btn bg-quiz-orange-500 hover:bg-quiz-orange-600"
            onClick={() => goPrevious()}
          >
            <ChevronLeftIcon />
            {!min && <span className="mr-2">ข้อก่อนหน้า</span>}
          </button>
        )}
      </div>
      <div className="flex flex-grow flex-row gap-4 justify-end">
        {!min && (
          <button
            title="รีเซ็ตคำตอบ"
            className="control-btn text-gray-900 bg-gray-200 hover:bg-gray-300"
            onClick={() => resetAnswer()}
          >
            <RefreshIcon />
            <span>รีเซ็ตคำตอบ</span>
          </button>
        )}
        {payload.current?.data.length !== index ? (
          <button
            title="ข้อถัดไป"
            className={`control-btn bg-quiz-orange-500 hover:bg-quiz-orange-600 ${
              min ? "" : "sm:w-32"
            }`}
            onClick={() => goNext()}
          >
            <ChevronRightIcon />
            {!min && <span className="mr-2">ข้อถัดไป</span>}
          </button>
        ) : (
          <button
            title="ส่ง"
            className={`control-btn bg-green-600 hover:bg-green-700 ${
              min ? "" : "md:w-28"
            }`}
            onClick={() => submit()}
          >
            <CheckIcon />
            {!min && <span className="mr-2">ส่ง</span>}
          </button>
        )}
      </div>
    </div>
  );

  const getSectionNames = useCallback(() => {
    if (!payload.current) return [];
    const name = payload.current.data[index - 1];
    if (!name) return [];
    const segments = name.split("~").slice(0, -1);
    return Object.entries(payload.current.names)
      .filter(([key]) => {
        for (let i = 0; i < segments.length; i++) {
          if (key === segments.slice(0, i + 1).join("~")) return true;
        }
        return false;
      })
      .map(([k, v]) => v);
  }, [index]);

  const currentExam =
    examList && typeof router.query.path === "string"
      ? examList.exam.find((v) => v.id === router.query.path)
      : undefined;
  const examName = `${currentExam?.subject} - ${
    currentExam && ExamLevel[currentExam.level]
  }`;

  return (
    <Container
      title={withExamName(
        index === 0 ? "กำลังโหลด..." : `ข้อที่ ${index}`,
        currentExam
      )}
      fullscreen
      scrollable={false}
    >
      <Navbar
        backBtn
        title={
          <div className="flex flex-col">
            <span>{currentExam ? examName : "กำลังโหลด.."}</span>
            <span className="text-sm font-normal text-gray-200">
              {getSectionNames().join(" - ")}
            </span>
          </div>
        }
      >
        {router.query.path && (
          <Timer
            submit={() => submit(false)}
            examId={router.query.path as string}
          />
        )}
      </Navbar>
      <div
        className={`flex flex-col flex-1 w-full items-center overflow-auto ${
          contentData ? "lg:overflow-hidden" : ""
        }`}
      >
        <div
          className={`flex-1 p-4 md:px-6  ${
            contentData || isValidating
              ? "lg:p-0 lg:grid lg:grid-cols-2 lg:flex-row"
              : "flex flex-col items-center max-w-2xl"
          } gap-8 lg:gap-0 w-full`}
        >
          {isValidating ? (
            <Scrollable>
              <div className="flex flex-col items-center justify-center h-full">
                <ContentLoading />
              </div>
            </Scrollable>
          ) : (
            <ContentViewer content={getContent()} />
          )}
          <Scrollable content={contentData !== undefined}>
            <div className="flex flex-row items-center py-2">
              <h3 className="font-bold text-lg text-quiz-blue-500 flex-grow flex-shrink-0">
                {index === 0 ? "กำลังโหลด..." : `${index}.`}
              </h3>
              <div>
                <Controls min />
              </div>
            </div>
            {isSubmitting ? (
              <ContentLoading />
            ) : (
              <Viewer ref={(ref) => (editorRef.current = ref as ViewerClass)} />
            )}
            <Controls />
            {index !== 0 && (
              <div className="w-full">
                <ItemSelector size={payload.current?.data.length ?? 0} />
              </div>
            )}
          </Scrollable>
        </div>
      </div>
    </Container>
  );
};

export default ExamView;
