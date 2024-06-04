import { ReactRenderer } from "@emrgen/carbon-react";
import { TableView } from "./renderers/table/TableView";

import "./database.styl";
import { TableColumn } from "./renderers/table/TableColumn";

export const databaseRenderers = [
  ReactRenderer.create("table", TableView),
  ReactRenderer.create("tableColumn", TableColumn),
];
