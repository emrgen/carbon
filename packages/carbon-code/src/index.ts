import { Extension, ReactRenderer } from "@emrgen/carbon-react";

import "./code.styl";
import { CodeBox } from "./plugins/CodeBox";
import { CodeLine } from "./plugins/CodeLine";
import { CodeLineComp } from "./renderers/CodeLine";
import { CodeMirrorComp } from "./renderers/codeMirror";
import { CodeMirror } from "./plugins/CodeMirror";
import { CodeBoxComp } from "./renderers/CodeBox";
import { CodeTitleComp } from "./renderers/CodeTitleComp";

export const codeExtension: Extension = {
  plugins: [new CodeBox(), new CodeLine(), new CodeMirror()],
  renderers: [
    ReactRenderer.create("codeTitle", CodeTitleComp),
    ReactRenderer.create("codeBox", CodeBoxComp),
    ReactRenderer.create("codeLine", CodeLineComp),
    ReactRenderer.create("codeMirror", CodeMirrorComp),
  ],
};
