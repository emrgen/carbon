import { CarbonPlugin } from "@emrgen/carbon-core";
import { TableView } from "./views/plugins/Table";

export const databasePlugins: CarbonPlugin[] = [new TableView()];

export * from "./constants";
