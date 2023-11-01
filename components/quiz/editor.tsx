import React from "react";

import type { Editor as EditorCore } from "@toast-ui/editor";
import type { EditorProps as BaseEditorProps } from "@toast-ui/react-editor";
import dynamic from "next/dynamic";

import { quizItemStore, quizStore } from "@/shared/store";
import BaseRenderer from "./base";
import { options } from "./options";

const ToastEditor = dynamic<BaseEditorProps>(
  () => import("@toast-ui/react-editor").then((c) => c.Editor as any),
  {
    ssr: false,
  }
);

type EditorProps = {
  item: number;
};

const defaultHeight = "600px";

/**
 * Editor usually changes their value, so we implemented many logics to reduce renders.
 */
export class Editor extends BaseRenderer<{ onReady?: () => void }> {
  editorRef = React.createRef<EditorCore>();
  itemListener?: () => void;
  currentItem = -1;

  constructor(props: { onReady?: () => void }) {
    super(props);
    this.setDeviceTypeBasedOnWidth = this.setDeviceTypeBasedOnWidth.bind(this);
  }

  getContent() {
    return this.editorRef.current?.getMarkdown();
  }

  getHTML() {
    return this.editorRef.current?.getHTML();
  }

  setContent(content: string) {
    const compareContent = this.editorRef.current?.getMarkdown() === content;
    if (!compareContent) {
      this.editorRef.current?.setMarkdown(content);
      setTimeout(() => {
        this.editorRef.current?.moveCursorToStart(true);
      }, 10);
    }
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
    window.addEventListener("resize", this.setDeviceTypeBasedOnWidth);
  }

  componentWillUnmount() {
    this.removeAnswerListener();
    if (this.itemListener) this.itemListener();
    window.removeEventListener("resize", this.setDeviceTypeBasedOnWidth);
  }

  setGlobalState() {
    const stateItem = quizItemStore.getState();
    if (stateItem.item === this.currentItem) {
      quizItemStore.setState({ content: this.getContent() ?? "" });
    }
  }

  setDeviceTypeBasedOnWidth() {
    if (window.innerWidth <= 768) this.setDeviceType("mobile");
    else this.setDeviceType("default");
  }
  overrideHeight(value: string) {
    if (this.editorRef.current?.getEditorElements().mdEditor) {
      this.editorRef.current.getEditorElements().mdEditor.style.height = value;
    }
  }

  setDeviceType(type: "mobile" | "default") {
    if (type === "default") {
      this.editorRef.current?.changePreviewStyle("vertical");
      this.overrideHeight(defaultHeight);
    } else {
      this.editorRef.current?.changePreviewStyle("tab");
      this.overrideHeight("70vh");
      setTimeout(() => {
        const tabContainer = document.querySelector(
          ".toastui-editor-md-tab-style"
        );
        // Loop each children of tabContainer
        // If there's an inline "min-height" style, override it with "min-height: 100%"
        if (tabContainer) {
          for (const child of Array.from(tabContainer.children)) {
            if (child instanceof HTMLElement && child.style.minHeight) {
              child.style.minHeight = "100%";
            }
          }
        }
      }, 10);
    }
  }

  render() {
    return (
      <>
        <ToastEditor
          placeholder="Start writing..."
          initialValue={quizItemStore.getState().content}
          previewStyle="tab"
          height={defaultHeight}
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
            setTimeout(() => {
              this.setDeviceTypeBasedOnWidth();
            }, 10);

            if (this.props.onReady) this.props.onReady();
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
