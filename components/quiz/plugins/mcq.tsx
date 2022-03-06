import { ComponentProps, HTMLAttributes } from "react";
import { PluginFn } from "@toast-ui/editor/types/editor";
import { HTMLToken } from "@toast-ui/editor/types/toastmark";
import { markdown } from "../markdown";
import { quizItemStore } from "@/shared/store";

export type MCQPluginOptions = {
  itemIndex: number;
};

export const mcqPlugin: PluginFn = () => {
  const parseChoice = (content: string) => {
    return content.split("\n").filter((v) => v !== "");
  };

  const renderChoice = (value: string, index: number): HTMLToken[] => {
    const state = quizItemStore.getState();
    const inputProps: Partial<HTMLInputElement> & Record<string, any> = {
      type: "radio",
      name: "quiz_choices_" + state.item,
      value: index.toString(),
      "data-quiz": "choices",
      ...(state.selected === index ? { checked: true } : {}),
    };

    const id = [inputProps.name, inputProps.value].join("_");
    return [
      {
        type: "openTag",
        tagName: "div",
        classNames: ["flex items-center gap-2", "quiz-choice"],
        outerNewLine: true,
      },
      {
        type: "openTag",
        tagName: "input",
        attributes: { ...inputProps, id },
      },
      {
        type: "closeTag",
        tagName: "input",
      },
      {
        type: "openTag",
        tagName: "label",
        attributes: {
          for: id,
        },
      },
      {
        type: "html",
        content: markdown(value),
      },
      {
        type: "closeTag",
        tagName: "label",
      },
      {
        type: "closeTag",
        tagName: "div",
        outerNewLine: true,
      },
    ];
  };

  return {
    toHTMLRenderers: {
      choices(node, ctx) {
        if (node.literal === null) return [];
        const choices = parseChoice(node.literal);
        return [
          {
            type: "openTag",
            tagName: "form",
            outerNewLine: true,
            classNames: ["flex flex-col space-y-2 my-4", "quiz-form"],
          },
          ...choices.map(renderChoice).flat(),
          { type: "closeTag", tagName: "form", outerNewLine: true },
        ];
      },
    },
  };
};
