import { useAuth } from "@/context/auth";
import { ExamListModel, ExamSubmission } from "@/types/exam";
import axios from "axios";
import { onIdTokenChanged } from "firebase/auth";
import { useEffect, useRef, useState } from "react";
import useSWR from "swr";
import { auth } from "./firebase";

export const useExamList = (immutable?: boolean) => {
  const { user, metadata } = useAuth();
  const [token, setToken] = useState<string | undefined>();
  const swr = useSWR(
    metadata?.exists && token && user ? ["/api/exam/list", token] : null,
    async (key, token) => {
      const { data } = await axios.get<ExamListModel>(key, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return data;
    },
    immutable
      ? {
          refreshWhenHidden: false,
          refreshWhenOffline: false,
          revalidateIfStale: false,
          revalidateOnFocus: false,
          revalidateOnReconnect: false,
        }
      : undefined
  );

  useEffect(() => {
    if (swr.error && axios.isAxiosError(swr.error)) {
      if (swr.error.response?.status === 428) {
        user?.getIdToken(true);
      }
    }
  }, [swr.error, user]);

  useEffect(
    () =>
      onIdTokenChanged(auth, async (user) => {
        if (user) {
          setToken(await user?.getIdToken());
        }
      }),
    [swr]
  );
  return swr;
};
