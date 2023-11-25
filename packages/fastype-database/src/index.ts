import { Extension, Renderer } from "@emrgen/carbon-core";
import { BoardViewComp } from "./renderer/BoardView";
import { BoardView } from "./plugins/BoardView";
import './database.styl';
import { BoardViewColumn } from "./plugins/BoardViewColumn";
import { BoardViewColumnComp } from "./renderer/BoardViewColumn";
import { BoardViewItem } from "./plugins/BoardViewItem";

export const fastypeDatabase: Extension = {
  plugins: [
    new BoardView(),
    new BoardViewColumn(),
    new BoardViewItem(),
  ],
  renderers: [
    Renderer.create('board', BoardViewComp),
    Renderer.create('boardColumn', BoardViewColumnComp),
  ]
}

