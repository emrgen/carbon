import { Extension, ReactRenderer } from "@emrgen/carbon-core";
import { TodoComp } from "./renderers/Todo";
import { Callout } from "./renderers/Callout";
import {SeparatorComp} from "./renderers/Separator";
import { Separator } from "./plugins/Separator";
// import { VideoComp } from "./renderers/Video";
import { ImageComp } from "./renderers/Image";
import { EquationComp } from "./renderers/Equation";
import { DocumentComp } from "./renderers/Document";

export const fastypeBlocks: Extension = {
  plugins: [
    new Separator()
  ],
  renderers: [
    ReactRenderer.create('todo', TodoComp),
    ReactRenderer.create('callout', Callout),
    ReactRenderer.create('separator', SeparatorComp),
    // Renderer.create('video', VideoComp),
    ReactRenderer.create('image', ImageComp),
    ReactRenderer.create('equation', EquationComp),
    // Renderer.create('code', CodeComp),
    ReactRenderer.create('document', DocumentComp),
  ]
}

