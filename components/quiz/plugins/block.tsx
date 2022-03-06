import { PluginFn } from "@toast-ui/editor/types/editor";
import { markdown } from "../markdown";
import { HTMLToken } from "@toast-ui/editor/types/toastmark";

export const customTextPlugin: PluginFn = () => {
  const shouldUseEngFont = (content: string) => {
    const thaiRegex = /[ก-๏]/g;
    if (thaiRegex.test(content)) return [];
    else return ["content-en"];
  };
  const generateContentBlock = (
    content: string,
    indent?: boolean
  ): HTMLToken[] => {
    return [
      {
        type: "openTag",
        tagName: "div",
        outerNewLine: true,
        classNames: [
          "content",
          ...shouldUseEngFont(content),
          ...(indent ? ["indent"] : []),
          "bg-gray-100",
          "rounded",
          "px-4",
          "py-4",
        ],
      },
      { type: "html", content: markdown(content) },
      { type: "closeTag", tagName: "div", outerNewLine: true },
    ];
  };
  return {
    toHTMLRenderers: {
      content(node) {
        if (node.literal === null) return [];
        return generateContentBlock(node.literal);
      },
      passage(node) {
        if (node.literal === null) return [];
        return generateContentBlock(node.literal, true);
      },
      columns(node) {
        if (node.literal === null) return [];
        return generateContentBlock(node.literal, true);
      },
      situation(node) {
        if (node.literal === null) return [];
        const nodes: HTMLToken[] = [];
        const addNode = (content: string) => {
          nodes.push({
            type: "html",
            content,
          });
        };
        node.literal.split("\n").map((line) => {
          const name = line.indexOf(":") + 1 || line.indexOf(".") + 1;
          if (name) {
            addNode(`<div>${line.slice(0, name)}</div>`);
          }
          addNode(markdown(line.slice(name).trim()));
        });
        return [
          {
            type: "openTag",
            tagName: "div",
            outerNewLine: true,
            classNames: [
              "situation",
              ...shouldUseEngFont(node.literal),
              "bg-gray-100",
              "rounded",
              "px-4",
              "py-4",
              "my-6",
            ],
          },
          ...nodes,
          { type: "closeTag", tagName: "div", outerNewLine: true },
        ];
      },
    },
  };
};
