import { useRouter } from "next/router";
import { useCallback } from "react";
import { quizStore } from "./store";

export const useExamQuery = () => {
  const { query, pathname, replace } = useRouter();

  const basePath = Array.isArray(query.path)
    ? query.path.join("/sections/")
    : undefined;

  const constructPath = (...path: Array<string | undefined>) => {
    return [basePath, ...path].filter((p) => p !== undefined).join("/");
  };

  const shallowReplace = useCallback(
    (item?: number) => {
      replace(
        {
          pathname,
          query: {
            ...query,
            ...(item ? { item } : {}),
          },
        },
        undefined,
        {
          shallow: true,
        }
      );
    },
    [replace, pathname, query]
  );

  const goPrevious = useCallback(() => {
    const index = quizStore.getState().currentItem;
    if (index !== 1) {
      shallowReplace(index - 1);
    }
  }, [shallowReplace]);

  const goNext = useCallback(() => {
    const index = quizStore.getState().currentItem;
    shallowReplace(index + 1);
  }, [shallowReplace]);

  return {
    constructPath,
    basePath,
    shallowReplace,
    goNext,
    goPrevious,
  };
};
