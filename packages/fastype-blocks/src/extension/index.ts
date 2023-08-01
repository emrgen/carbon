import { Extension, Renderer } from "@emrgen/carbon-core";
import { TodoComp } from "./renderers/Todo";
import { Callout } from "./renderers/Callout";

export const fastypeBlocks: Extension = {
  renderers: [
    Renderer.create('todo', TodoComp),
    Renderer.create('callout', Callout)
  ]
}

