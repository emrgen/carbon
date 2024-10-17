import { ReactRenderer } from "@emrgen/carbon-react";
import "./cell.styl";
import { CellComp } from "./components/CellComp";
import { Cell } from "./core/Cell";
import { CellViewComp } from "./components/CellViewComp";
import { CellCodeComp } from "./components/CellCodeComp";

export const cellPlugin = new Cell();

export const cellRenderer = [
  ReactRenderer.create("cell", CellComp),
  ReactRenderer.create("cellView", CellViewComp),
  ReactRenderer.create("cellCode", CellCodeComp),
];

export * from "./core/Cell";
export * from "./hooks/useModule";
