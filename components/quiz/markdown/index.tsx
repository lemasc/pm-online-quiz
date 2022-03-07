import { PluginFn } from "@toast-ui/editor/types/editor";
import SimpleMarkdown from "simple-markdown";
import { mathRules } from "./math";
import { newLineRule } from "./newLine";
import { staticVarsRule } from "./staticVars";
import { MarkdownRule } from "./types";
import { underlineRule } from "./underline";

const rules = {
  ...mathRules,
  underline: underlineRule,
  newLine: newLineRule,
  ...staticVarsRule,
  // Add a text rule to allow all values except the custom rules we given.
  // Prevent bug that virtual nodes are conflicted.

  text: SimpleMarkdown.defaultRules.text,
};

const rulesWithDefault = {
  ...SimpleMarkdown.defaultRules,
  ...rules,
  text: {
    ...SimpleMarkdown.defaultRules.text,
    // We need to allow uses of HTML tags.
    // This is dangerous, but we are too lazy to define custom inline for every each customization.
    html: function (node: SimpleMarkdown.SingleASTNode) {
      return node.content;
    },
  },
};

/**
 * Toast UI is customizable with block plugins, but not inline ones.
 * Using regex alone is slowing down the process and causing bugs.
 *
 * So we send the text to Khan's `simple-markdown` library, and add any necessary stuffs there.
 */
export const inlinePlugin: PluginFn = () => {
  const rawBuiltParser = SimpleMarkdown.parserFor(rules);
  const parse = function (source: string) {
    var blockSource = source + "\n\n";
    return rawBuiltParser(blockSource, { inline: false });
  };
  const output = SimpleMarkdown.outputFor(rules, "html");
  return {
    toHTMLRenderers: {
      text(node) {
        return {
          type: "html",
          content: output(parse(node.literal ?? "")),
        };
      },
    },
  };
};

/**
 * Standalone markdown parser that both handle CommonMark specs and our custom rules.
 */
export const markdown = (content: string): string => {
  const rawBuiltParser = SimpleMarkdown.parserFor(rulesWithDefault);
  const parse = function (source: string) {
    var blockSource = source + "\n\n";
    return rawBuiltParser(blockSource, { inline: false });
  };
  const output = SimpleMarkdown.outputFor(rulesWithDefault, "html");
  return output(parse(content));
};
