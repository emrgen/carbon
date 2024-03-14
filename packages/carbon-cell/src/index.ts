import {Cell} from "./Cell";
import {ReactRenderer} from "@emrgen/carbon-react";
import {CellComp} from "./CellComp";
import {CellViewComp} from "./CellViewComp";
import './cell.styl';

export const cellPlugin = new Cell()

export const cellRenderer =  [
  ReactRenderer.create('cell', CellComp),
  ReactRenderer.create('cellView', CellViewComp),
]

