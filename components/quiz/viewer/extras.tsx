import Scrollable from "@/components/Scrollable";
import { QuizItemState, quizItemStore } from "@/shared/store";
import { timerStore } from "@/shared/timer";
import dayjs from "dayjs";
import React, { useEffect } from "react";
import { ViewerClass } from "./base";
import TimeModal from "./timeModal";

export const ContentViewer = React.memo(function ContentViewer({
  content,
}: {
  content?: QuizItemState;
}) {
  const [state, setState] = React.useState<QuizItemState>({
    item: -2,
    content: "",
    selected: -1,
  });

  React.useEffect(() => {
    if (!content) return;
    // Viewer will rerender on content changed only.
    // So we must set neccessary variables in order or it won't work.
    quizItemStore.setState({
      startIndex: content.startIndex,
    });
    setState(content);
  }, [content]);
  if (!content) return null;
  return (
    <Scrollable content={true}>
      {state.content !== "" && <ViewerClass state={state} />}
    </Scrollable>
  );
});

export const Timer = React.memo(function Timer({
  examId,
  submit,
}: {
  examId: string;
  submit: () => void;
}) {
  const timerRef = React.useRef<NodeJS.Timer>();
  const timeUp = timerStore(
    React.useCallback((state) => !!state._state.get(examId)?.timeUp, [examId])
  );
  const state = timerStore(
    React.useCallback(
      (state) => state._state.get(examId)?.timePending,
      [examId]
    )
  );

  React.useEffect(() => {
    if (timeUp) return;
    if (state === undefined) return;
    timerRef.current = setInterval(() => {
      timerStore.getState().set(examId, (state) => {
        const timePending = (state?.timePending as number) - 1000;
        return {
          ...state,
          timeUp: timePending < 0,
          timePending,
        };
      });
    }, 1000);
    return () => {
      timerRef.current && clearInterval(timerRef.current);
    };
  }, [examId, state, timeUp]);

  useEffect(() => {
    return () => {
      timerStore.getState().clearTimer(examId);
    };
    // We use this to unmounted on page load only, not on deps changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (state === undefined) return null;

  const formatTime = () => {
    const time = dayjs.duration(state > 0 ? state : 0);
    const result = [time.get("h"), time.get("m"), time.get("s")];
    return result.map((v) => Math.floor(v).toString().padStart(2, "0"));
  };

  return (
    <>
      <div className="flex-shrink-0 bg-white py-2 px-3 rounded text-black">
        {formatTime().join(" : ")}
      </div>
      {timeUp && <TimeModal submit={submit} />}
    </>
  );
});
