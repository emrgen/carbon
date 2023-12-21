import {Extension, Renderer} from "@emrgen/carbon-core";
import {CodeLine} from "./plugins/CodeLine";
import {Code} from "./plugins/Code";
import {CodeComp} from "./renderers/Code";
import {CodeLineComp} from "./renderers/CodeLine";
import "./code.styl";

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
