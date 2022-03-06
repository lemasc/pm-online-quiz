import { quizItemStore } from "@/shared/store";
import React from "react";
import type { Viewer } from "@toast-ui/editor";

/** Mock type used to access the hidden `previewContent` element. */
type MarkdownPreview = {
  previewContent: HTMLElement;
};

export default class BaseRenderer<T = {}> extends React.Component<T> {
  private targetEl?: HTMLElement;
  addAnswerListener(viewer: Viewer) {
    const preview = (viewer as any).preview as MarkdownPreview;
    this.targetEl = preview.previewContent;
    setTimeout(() => {
      this.targetEl?.addEventListener("click", this.handleAnswer);
    });
  }
  removeAnswerListener() {
    this.targetEl?.removeEventListener("click", this.handleAnswer);
  }
  handleAnswer(e: MouseEvent) {
    const target = e.target as HTMLInputElement;
    if (
      target &&
      target.tagName === "INPUT" &&
      target.dataset.quiz === "choices" &&
      target.checked
    ) {
      quizItemStore.setState({ selected: parseInt(target.value) });
    }
  }
  /**
   * We already did this at the plugin level, but after navigation the value might be lost.
   * Force select on component update
   */
  setAnswerValue(selected: number) {
    if (selected !== undefined) {
      document
        .querySelectorAll<HTMLInputElement>(`input[data-quiz="choices"]`)
        .forEach((item, index) => {
          if (index === selected) item.checked = true;
          else item.checked = false;
        });
    }
  }
}
