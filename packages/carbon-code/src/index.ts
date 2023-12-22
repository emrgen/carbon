import {Extension, Renderer} from "@emrgen/carbon-core";

import "./code.styl";
import {Code} from "./plugins/Code";
import {CodeLine} from "./plugins/CodeLine";
import {CodeComp} from "./renderers/Code";
import {CodeLineComp} from "./renderers/CodeLine";

export const codeExtension: Extension = {
  plugins: [
    new Code(),
    new CodeLine()
  ],
  renderers: [
    Renderer.create("code", CodeComp),
    Renderer.create("codeLine", CodeLineComp)
  ]
}
