import { ReactRenderer } from "@emrgen/carbon-react";
import { Design } from "./plugin/Design";
import "./design.styl";
import { DesignBoardComp } from "./renderer/DesignBoard";
import { ElementComp } from "./renderer/ElementComp";
import { TransformerComp } from "./renderer/Transformer";

export * from "./contants";
export * from "./core/Affine";

export const designPlugin = new Design();

export const designRenderers = [
  ReactRenderer.create("deBoard", DesignBoardComp),
  ReactRenderer.create("deElement", ElementComp),
  ReactRenderer.create("deTransformer", TransformerComp),
];