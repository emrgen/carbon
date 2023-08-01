import { Extension, Renderer } from "@emrgen/carbon-core";
import { TodoComp } from "./renderers/Todo";

export const fastypeBlocks: Extension = {
  renderers: [
    Renderer.create('todo', TodoComp)
  ]
}

