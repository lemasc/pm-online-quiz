import { useAuth } from "@/context/auth";
import { ExamContentPayload, ExamStartPayload } from "@/types/exam";
import { useRouter } from "next/router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Middleware, SWRConfiguration, SWRHook, mutate } from "swr";
import useSWR from "swr/immutable";
import { QuizItem } from "../types";
import { quizStore, useQuizStoreSync } from "./store";
import { RemoteExamError, remoteExam } from "./timer";

const axiosFetch = (key: string) => remoteExam.get(key).then((r) => r.data);

const laggy: Middleware = (useSWRNext: SWRHook) => (key, fetcher, config) => {
  // Use a ref to store previous returned data.
  const laggyDataRef = useRef<any>();

  // Actual SWR hook.
  const swr = useSWRNext(key, fetcher, config);

  useEffect(() => {
    // Update ref if data is not undefined.
    if (swr.data !== undefined) {
      laggyDataRef.current = swr.data;
    }
  }, [swr.data]);

  // Expose a method to clear the laggy data, if any.
  const resetLaggy = useCallback(() => {
    laggyDataRef.current = undefined;
  }, []);

  const keyResult = typeof key === "function" ? key() : key;
  const canShowLagData = keyResult && swr.data === undefined;

  // Fallback to previous data if the current data is undefined.
  const dataOrLaggyData = canShowLagData ? laggyDataRef.current : swr.data;

  // Is it showing previous data?
  const isLagging = canShowLagData && laggyDataRef.current !== undefined;

  // Also add a `isLagging` field to SWR.
  return Object.assign({}, swr, {
    data: dataOrLaggyData,
    isLagging,
    resetLaggy,
  });
};

export type ExamState = {
  startRequest?: number;
  success: boolean;
  timer?: NodeJS.Timeout;
  lastConnect: Date;
  timePending: number;
  nextCheck?: NodeJS.Timeout;
  latency?: number;
};

const config: SWRConfiguration = {
  onErrorRetry: (
    err: RemoteExamError,
    key,
    config,
    revalidate,
    { retryCount }
  ) => {
    if (err.isTimeEnd) return;
    if (err.isRecoverable) {
      if (retryCount >= 5) return;
      setTimeout(() => revalidate({ retryCount }), 5000);
    }
  },
};

export const useRemoteExam = ({ payload }: { payload?: ExamStartPayload }) => {
  const { query } = useRouter();
  const { user } = useAuth();
  const createSWRKey = useCallback(
    (index: number) =>
      payload &&
      // Array index must be minus 1
      payload.data[index - 1] &&
      typeof query.path === "string"
        ? `/api/exam/${query.path}/item/${payload?.data[index - 1]}`
        : null,
    [query.path, payload]
  );

  const { index } = useQuizStoreSync();

  const item = useSWR<QuizItem>(
    user && index !== 0 && createSWRKey(index),
    axiosFetch,
    config
  );
  const contentFetcher = useCallback(() => {
    const id = payload?.data[index - 1];
    if (!payload || !id || !payload?.content) return null;
    for (const contentKey of payload.content) {
      if (id.startsWith(contentKey)) {
        return `/api/exam/${query.path}/content/${contentKey}`;
      }
    }
    return null;
  }, [index, query.path, payload]);

  const content = useSWR<ExamContentPayload>(
    user && contentFetcher,
    axiosFetch,
    {
      use: [laggy],
      ...config,
    }
  );

  const prefetchItem = useCallback(
    (index) => {
      if (index === 0) return;
      const key = createSWRKey(index);
      const items = quizStore.getState().items;
      if (key && !items.get(index)?.content) {
        mutate(key, axiosFetch(key));
      }
    },
    [createSWRKey]
  );

  useEffect(() => {
    if (!item.data) return;
    prefetchItem(index + 1);
    prefetchItem(index - 1);
  }, [item.data, index, prefetchItem]);

  const [error, setError] = useState<RemoteExamError>();

  useEffect(() => {
    setError(item.error ?? content.error);
  }, [item.error, content.error, setError]);

  return { item, content, error };
};
