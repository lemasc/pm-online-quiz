import create, { GetState, SetState, StateSelector } from "zustand";
import { QuizItem, QuizModel } from "../types";
import {
  StoreApiWithSubscribeWithSelector,
  subscribeWithSelector,
} from "zustand/middleware";
import { useEffect, useRef } from "react";
import shallow from "zustand/shallow";
import { CONTENT_INDEX } from "./constants";

export type QuizItemState = QuizItem & {
  startIndex?: number;
  item: number;
};

/**
 * Quiz Item Store stores the current quiz item and is used through editor and renderer.
 */
export const quizItemStore = create<
  QuizItemState,
  SetState<QuizItemState>,
  GetState<QuizItemState>,
  StoreApiWithSubscribeWithSelector<QuizItemState>
>(
  // @ts-expect-error Types not incompatible even follow their docs?
  subscribeWithSelector((set) => ({
    item: 0,
    content: "",
    selected: -1,
    setItem: (index: number) => set(() => ({ item: index })),
    setContent: (content: string) => set(() => ({ content })),
    setSelected: (selected: number) => set(() => ({ selected })),
  }))
);

export type QuizState = {
  currentItem: number;
  items: Map<number, QuizItem>;
  setCurrentItem: (set: (currentItem: number) => number) => void;
  setItems: (set: (state: QuizState["items"]) => QuizState["items"]) => void;
};

/**
 * Quiz Store stores the current quiz information and all subitems.
 */
export const quizStore = create<
  QuizState,
  SetState<QuizState>,
  GetState<QuizState>,
  StoreApiWithSubscribeWithSelector<QuizState>
>(
  subscribeWithSelector((set, get) => ({
    currentItem: 0,
    items: new Map(),
    setCurrentItem: (currentItem) => {
      set((state) => ({ currentItem: currentItem(state.currentItem) }));
    },
    setItems: (setter) => {
      set((state) => ({ items: setter(state.items) }));
    },
  }))
);

export const setItems = quizStore.getState().setItems;
export const setIndex = quizStore.getState().setCurrentItem;

const itemSelector: StateSelector<QuizState, number> = (state) =>
  state.currentItem;
const sizeSelector: StateSelector<QuizState, number> = (state) =>
  Array.from(state.items.keys()).filter((v) => v !== CONTENT_INDEX).length;

export const useQuizStoreSync = () => {
  const unmountTimeout = useRef<NodeJS.Timeout>();
  const index = quizStore(itemSelector);
  const size = quizStore(sizeSelector);

  useEffect(() => {
    // Synchronize the quizStore with thethe modified quizItemStore
    return quizItemStore.subscribe(
      (state) => state,
      (state) => {
        setItems((map) => {
          const _map = new Map(map).set(state.item, {
            content: state.content,
            selected: state.selected,
          });
          return _map;
        });
      },
      {
        equalityFn: shallow,
      }
    );
  }, []);

  useEffect(() => {
    // Synchronize the quizItemStore with the current index quizStore
    return quizStore.subscribe((state) => {
      const items = state.items;
      const index = state.currentItem;
      if (!items.get(index)) return;
      quizItemStore.setState({
        content: items.get(index)?.content as string,
        item: index,
        selected: items.get(index)?.selected as number,
      });
    });
  }, []);

  useEffect(() => {
    // Mounted or rerendered `useStoreSync`. Do not reset data.
    if (unmountTimeout.current) clearTimeout(unmountTimeout.current);
    return () => {
      unmountTimeout.current = setTimeout(() => {
        quizStore.setState({ items: new Map(), currentItem: 0 });
        quizItemStore.setState({ item: 0, content: "", selected: -1 });
      }, 200);
    };
  }, []);

  return {
    index,
    size,
  };
};
