import { EditorProps, ViewerProps } from "@toast-ui/react-editor";

import { customTextPlugin, mcqPlugin } from "./plugins";
import { inlinePlugin } from "./markdown";

type SharedOptions = EditorProps & ViewerProps;

export const options: SharedOptions = {
  plugins: [inlinePlugin, mcqPlugin, customTextPlugin],
  customHTMLSanitizer: (content) => content,
};
