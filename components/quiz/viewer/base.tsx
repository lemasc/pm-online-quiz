import React, { useEffect } from "react";

import type { Viewer as ViewerCore } from "@toast-ui/editor";
import type { ViewerProps as BaseViewerProps } from "@toast-ui/react-editor";
import dynamic from "next/dynamic";

import { options } from "../options";
import { quizItemStore, QuizItemState } from "@/shared/store";
import BaseRenderer from "../base";
import { Oval } from "react-loader-spinner";

const ToastViewer = dynamic<BaseViewerProps>(
  () => import("@toast-ui/react-editor").then((c) => c.Viewer as any),
  {
    ssr: false,
  }
);

type ViewerProps = {
  state: QuizItemState;
};

export class ViewerClass extends BaseRenderer<ViewerProps> {
  viewerRef = React.createRef<ViewerCore>();
  startAtListener?: () => void;

  setContent(content: string) {
    this.viewerRef.current?.setMarkdown(content);
  }
  componentWillUnmount() {
    this.removeAnswerListener();
    if (this.startAtListener) this.startAtListener();
  }

  componentDidMount() {
    if (this.props.state.selected) {
      this.setAnswerValue(this.props.state.selected);
    }
    this.startAtListener = quizItemStore.subscribe(
      (state) => state.startIndex,
      () => {
        // If startAt value changes, we should rerender the component.
        this.setContent(this.props.state.content);
      }
    );
  }
  componentDidUpdate(prevProps: ViewerProps) {
    if (this.props.state.content !== prevProps.state.content) {
      this.setContent(this.props.state.content);
    }
    if (this.props.state.selected !== prevProps.state.selected) {
      this.setAnswerValue(this.props.state.selected);
    }
  }

  render() {
    return (
      <>
        <ToastViewer
          initialValue={this.props.state.content}
          onLoad={(editor) => {
            /** @ts-expect-error Ref is doing crazy. Use onLoad instead */
            this.viewerRef.current = editor;
            this.addAnswerListener(editor);
          }}
          {...options}
        />
      </>
    );
  }
}

const Viewer = React.forwardRef<ViewerClass>(function Viewer(props, ref) {
  const state = quizItemStore();
  return state.content ? (
    <ViewerClass ref={ref} state={state} />
  ) : (
    <ContentLoading />
  );
});

export const ContentLoading = React.memo(function ContentLoading() {
  return (
    <div className="flex flex-col items-center justify-center py-8">
      <Oval
        ariaLabel="loading-indicator"
        height={50}
        width={50}
        strokeWidth={4}
        color="#246F9A"
        secondaryColor="#3E9CD2"
      />
    </div>
  );
});

export default React.memo(Viewer);
