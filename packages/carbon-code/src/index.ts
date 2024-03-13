import {Extension} from "@emrgen/carbon-core";
import {ReactRenderer} from "@emrgen/carbon-react";

import "./code.styl";
import {Code} from "./plugins/Code";
import {CodeLine} from "./plugins/CodeLine";
import {CodeComp} from "./renderers/Code";
import {CodeLineComp} from "./renderers/CodeLine";
import {CodeMirrorComp} from "./renderers/codeMirror";
import {CodeMirror} from "./plugins/CodeMirror";

export const codeExtension: Extension = {
  plugins: [
    new Code(),
    new CodeLine(),
    new CodeMirror(),
  ],
  renderers: [
    ReactRenderer.create("code", CodeComp),
    ReactRenderer.create("codeLine", CodeLineComp),
    ReactRenderer.create("codeMirror", CodeMirrorComp),
  ]
}
