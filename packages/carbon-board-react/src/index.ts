import { ReactRenderer } from "@emrgen/carbon-react";
import { SquareCanvas } from "./renderers/SquareCanvas";
import { SquareBoardItem } from "./renderers/SquareBoardItem";

import "./board.styl";
import { Board } from "./renderers/Board";
import { Column } from "./renderers/Column";

export const boardRenderers = [
  ReactRenderer.create("sqCanvas", SquareCanvas),
  ReactRenderer.create("sqNote", SquareBoardItem),
  ReactRenderer.create("sqBoard", Board),
  ReactRenderer.create("sqColumn", Column),
];
