import { ReactRenderer } from "@emrgen/carbon-react";
import "./cell.styl";
import { CellComp } from "./components/Cell";
import { Cell } from "./plugins/Cell";

export const cellPlugin = new Cell();

export const cellRenderer = [ReactRenderer.create("cell", CellComp)];

export * from "./plugins/Cell";
export * from "./hooks/useActiveCellRuntime";
export * from "./core/Nodes";
export * from "./core/ActiveCellRuntime";
