import { CarbonPlugin } from "@emrgen/carbon-core";
import { TableView } from "./views/plugins/Table";
import "./database.styl";

export const databasePlugins: CarbonPlugin[] = [new TableView()];
