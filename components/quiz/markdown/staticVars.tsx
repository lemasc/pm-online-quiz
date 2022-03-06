import { MarkdownRule } from "./types";
import SimpleMarkdown from "simple-markdown";
import { quizItemStore, quizStore } from "@/shared/store";

const spaces = Array(8).fill("&nbsp;").join("");

const itemRegex = `\\((-?[\\d]{1,2})\\)`;

const computeItem = (item: number) => {
  const state = quizItemStore.getState();
  let currentItem = state.startIndex ?? 0;
  if (item === 0) {
    // This is a special index, that will show the ACTUAL current item rather than
    // relative to the startIndex
    return state.item.toString();
  }
  return (currentItem + item).toString();
};

export const staticVarsRule: Record<string, MarkdownRule> = {
  item: {
    // Specify the order in which this rule is to be run
    order: SimpleMarkdown.defaultRules.text.order - 0.5,

    // First we check whether a string matches
    match: function (source) {
      return new RegExp(`^\\[item${itemRegex}\\]`).exec(source);
    },

    // Then parse this string into a syntax node
    parse: function (capture) {
      return {
        content: parseInt(capture[1]),
      };
    },
    html: function (node) {
      return computeItem(node.content);
    },
  },
  fillIn: {
    // Specify the order in which this rule is to be run
    order: SimpleMarkdown.defaultRules.text.order - 0.75,

    // First we check whether a string matches
    match: function (source) {
      return new RegExp(`^\\[fill-in${itemRegex}\\]`).exec(source);
    },

    // Then parse this string into a syntax node
    parse: function (capture) {
      return {
        content: parseInt(capture[1]),
      };
    },
    html: function (node) {
      return `<u>${spaces}${computeItem(node.content)}${spaces}</u>`;
    },
  },
};
