import { Extension } from "@emrgen/carbon-core";
import { BoardViewComp } from "./renderer/BoardView";
import { BoardView } from "./plugins/BoardView";
import './database.styl';
import { BoardViewColumn } from "./plugins/BoardViewColumn";
import { BoardViewColumnComp } from "./renderer/BoardViewColumn";
import { BoardViewItem } from "./plugins/BoardViewItem";
import { ReactRenderer } from "@emrgen/carbon-react";

export const fastypeDatabase: Extension = {
  plugins: [
    new BoardView(),
    new BoardViewColumn(),
    new BoardViewItem(),
  ],
  renderers: [
    ReactRenderer.create('board', BoardViewComp),
    ReactRenderer.create('boardColumn', BoardViewColumnComp),
  ]
}

