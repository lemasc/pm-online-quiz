import React from "react";

import type { Editor as EditorCore } from "@toast-ui/editor";
import type { EditorProps as BaseEditorProps } from "@toast-ui/react-editor";
import dynamic from "next/dynamic";

import { options } from "./options";
import { quizItemStore, quizStore } from "@/shared/store";
import BaseRenderer from "./base";

const ToastEditor = dynamic<BaseEditorProps>(
  () => import("@toast-ui/react-editor").then((c) => c.Editor as any),
  {
    ssr: false,
  }
);

type EditorProps = {
  item: number;
};

/**
 * Editor usually changes their value, so we implemented many logics to reduce renders.
 */
export class Editor extends BaseRenderer {
  editorRef = React.createRef<EditorCore>();
  itemListener?: () => void;
  currentItem = -1;

  getContent() {
    return this.editorRef.current?.getMarkdown();
  }

  setContent(content: string) {
    this.editorRef.current?.setMarkdown(content);
  }

  reset() {
    this.editorRef.current?.reset();
  }

  componentDidMount() {
    this.itemListener = quizItemStore.subscribe(
      (state) => state.item,
      (item) => {
        const targetItem = quizStore.getState().items.get(item);
        if (targetItem) {
          this.setContent(targetItem.content);
          this.setAnswerValue(targetItem.selected);
        } else this.reset();
        this.currentItem = item;
      }
    );
  }

  componentWillUnmount() {
    this.removeAnswerListener();
    if (this.itemListener) this.itemListener();
  }

  setGlobalState() {
    const stateItem = quizItemStore.getState();
    if (stateItem.item === this.currentItem) {
      quizItemStore.setState({ content: this.getContent() ?? "" });
    }
  }

  render() {
    return (
      <>
        <ToastEditor
          placeholder="Start writing..."
          initialValue={quizItemStore.getState().content}
          previewStyle="vertical"
          height="600px"
          initialEditType="markdown"
          hideModeSwitch
          useCommandShortcut={true}
          toolbarItems={[
            ["heading", "bold", "italic", "strike"],
            ["hr", "quote"],
            ["ul", "ol"],
            ["table", "image", "link"],
          ]}
          onLoad={(editor) => {
            /** @ts-expect-error Ref is doing crazy. Use onLoad instead */
            this.editorRef.current = editor;
            this.addAnswerListener(editor);
          }}
          onChange={() => {
            this.setGlobalState();
          }}
          {...options}
        />
      </>
    );
  }
}

export default Editor;
