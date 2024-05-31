import "./attrs.styl";
import { ReactRenderer } from "@emrgen/carbon-react";
import { CarbonAttrs } from "./components/CarbonAttributes";
import CarbonAttribute from "./components/CarbonAttribute";

export const attrRenderers = [
  ReactRenderer.create("attributes", CarbonAttrs),
  ReactRenderer.create("attribute", CarbonAttribute),
];
export * from "./constants";
