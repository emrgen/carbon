import { Extension, Renderer } from "@emrgen/carbon-core";
import { TodoComp } from "./renderers/Todo";
import { Callout } from "./renderers/Callout";
import {SeparatorComp} from "./renderers/Separator";
import { Separator } from "./plugins/Separator";
import { VideoComp } from "./renderers/Video";
import { ImageComp } from "./renderers/Image";
import { EquationComp } from "./renderers/Equation";
import { CodeComp } from "./renderers/Code";
import { DocumentComp } from "./renderers/Document";

export const fastypeBlocks: Extension = {
  plugins: [
    new Separator()
  ],
  renderers: [
    Renderer.create('todo', TodoComp),
    Renderer.create('callout', Callout),
    Renderer.create('separator', SeparatorComp),
    Renderer.create('video', VideoComp),
    Renderer.create('image', ImageComp),
    Renderer.create('equation', EquationComp),
    Renderer.create('code', CodeComp),
    Renderer.create('document', DocumentComp),
  ]
}

