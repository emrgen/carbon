import { Extension, ReactRenderer } from "@emrgen/carbon-react";
import { Separator } from "./plugins/Separator";
import { Callout } from "./renderers/Callout";
import { DocumentComp } from "./renderers/Document";
import { EquationComp } from "./renderers/Equation";
// import { VideoComp } from "./renderers/Video";
import { SeparatorComp } from "./renderers/Separator";
import { TodoComp } from "./renderers/Todo";

export const fastypeBlocks: Extension = {
  plugins: [new Separator()],
  renderers: [
    ReactRenderer.create("todo", TodoComp),
    ReactRenderer.create("callout", Callout),
    ReactRenderer.create("separator", SeparatorComp),
    ReactRenderer.create("equation", EquationComp),
    ReactRenderer.create("document", DocumentComp),
  ],
};
