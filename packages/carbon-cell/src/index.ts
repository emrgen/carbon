import { ReactRenderer } from "@emrgen/carbon-react";
import "./cell.styl";
import { CellComp } from "./components/CellComp";
import { Cell } from "./core/Cell";
import { ViewComp } from "./components/ViewComp";
import { CodeComp } from "./components/CodeComp";

export const cellPlugin = new Cell();

export const cellRenderer = [
  ReactRenderer.create("cell", CellComp),
  ReactRenderer.create("cellView", ViewComp),
  ReactRenderer.create("cellCode", CodeComp),
];

export * from "./core/Cell";
export * from "./hooks/useModule";
