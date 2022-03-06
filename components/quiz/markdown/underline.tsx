import SimpleMarkdown from "simple-markdown";
import { MarkdownRule } from "./types";

export const underlineRule: MarkdownRule = {
  // Specify the order in which this rule is to be run
  order: SimpleMarkdown.defaultRules.em.order - 0.5,

  // First we check whether a string matches
  match: function (source) {
    return /^__([\s\S]+?)__(?!_)/.exec(source);
  },

  // Then parse this string into a syntax node
  parse: function (capture, parse, state) {
    return {
      content: parse(capture[1], state),
    };
  },
  html: function (node, output) {
    return "<u>" + output(node.content) + "</u>";
  },
};
