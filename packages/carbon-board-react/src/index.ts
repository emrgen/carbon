import { ReactRenderer } from "@emrgen/carbon-react";
import { Board } from "./renderers/Board";
import { Note } from "./renderers/Note";

import "./board.styl";

export const boardRenderers = [
  ReactRenderer.create("sqBoard", Board),
  ReactRenderer.create("sqNote", Note),
];
