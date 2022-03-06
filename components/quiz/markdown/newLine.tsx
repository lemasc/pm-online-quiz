import SimpleMarkdown from "simple-markdown";
import { MarkdownRule } from "./types";

export const newLineRule: MarkdownRule = {
  // Specify the order in which this rule is to be run
  order: SimpleMarkdown.defaultRules.text.order - 1.5,

  // First we check whether a string matches
  match: function (source) {
    return /^\\n/.exec(source);
  },

  // Then parse this string into a syntax node
  parse: function () {
    return {};
  },
  html: function (node, output) {
    return "<br>";
  },
};
