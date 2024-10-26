import { ReactRenderer } from "@emrgen/carbon-react";
import { Design } from "./plugin/Design";
import "./design.styl";
import { DesignBoardComp } from "./renderer/DesignBoard";
import { DesignElement } from "./renderer/DesignElement";

export const designPlugin = new Design();

export const designRenderers = [
  ReactRenderer.create("deBoard", DesignBoardComp),
  ReactRenderer.create("deShape", DesignElement),
];