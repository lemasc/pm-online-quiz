import { useEffect, useContext, createContext, useRef } from "react";
import { useRouter } from "next/router";

type IHistoryRouter = {
  back: (baseUrl: string) => void;
};

export const historyContext = createContext<IHistoryRouter | undefined>(
  undefined
);

export const useHistoryRouter = () => {
  const ctx = useContext(historyContext);
  if (!ctx) throw new Error("Outside context");
  return ctx;
};

export function useProvideHistory(): IHistoryRouter {
  const router = useRouter();

  const historyStack = useRef<Set<string>>(new Set());
  const popStateStack = useRef<Set<string>>(new Set());

  useEffect(() => {
    router.beforePopState(({ as }) => {
      popStateStack.current.add(as);
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!router.isReady) return;
    const handleRouteChange = (
      url: string,
      { shallow }: { shallow: boolean }
    ) => {
      if (shallow) return;
      let shouldRemove = false;
      if (popStateStack.current.has(url)) {
        popStateStack.current.delete(url);
        historyStack.current.forEach((history) => {
          if (history === url) shouldRemove = true;
          else if (shouldRemove) historyStack.current.delete(history);
        });
      } else {
        historyStack.current.add(url);
      }
    };
    historyStack.current.add(router.asPath);
    router.events.on("routeChangeComplete", handleRouteChange);
    return () => router.events.on("routeChangeComplete", handleRouteChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady]);

  return {
    back: (baseUrl: string) => {
      if (
        !historyStack.current.has(baseUrl) ||
        historyStack.current.size === 1
      ) {
        router.replace(baseUrl);
      } else router.back();
    },
  };
}
