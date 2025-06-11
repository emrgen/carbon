import { ReactRenderer } from "@emrgen/carbon-react";
import { LiveCellComp } from "./renderer/ReactiveCell";
import "./live-cell.styl";

export * from "./hooks/useReactiveRuntime";

export * from "./plugin/ReactiveCell";

export const LiveCellRenderer = ReactRenderer.create("liveCell", LiveCellComp);
