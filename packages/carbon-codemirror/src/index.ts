import { Extension, ReactRenderer } from "@emrgen/carbon-react";

import "./codemirror.styl";
import "./codemirror-editor.styl";
import { CodeMirrorEditor } from "./components/CodeMirrorEditor";
import { MonacoEditor } from "./components/MonacoEditor";
import { CodeMirror, CodeMirrorContentPath } from "./plugins/CodeMirror";
import { CodeMirrorComp } from "./renderers/CodeMirror";

export const codemirrorExtension: Extension = {
  plugins: [new CodeMirror()],
  renderers: [ReactRenderer.create("codemirror", CodeMirrorComp)],
};

export { CodeMirrorContentPath, CodeMirrorEditor, MonacoEditor };
export * from "./hooks";
