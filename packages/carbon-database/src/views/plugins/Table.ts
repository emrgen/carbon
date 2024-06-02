import {
  CarbonPlugin,
  ContenteditablePath,
  NodeSpec,
} from "@emrgen/carbon-core";
import { ColumnsPath, DbLinkPath } from "../../constants";

// This is a simple plugin that defines a TableView node type.
export class TableView extends CarbonPlugin {
  name = "tableView";

  override spec(): NodeSpec {
    return {
      group: "content",
      content: "tableRowView+",
      isolate: true,

      // This is the default node data for a TableView block
      default: {
        name: "tableView",
        links: {
          [ColumnsPath]: {
            name: "tableViewColumnNames",
            children: [],
          },
        },
      },

      props: {
        [DbLinkPath]: "",
        [ContenteditablePath]: false,
      },
    };
  }

  plugins(): CarbonPlugin[] {
    return [new TableRow()];
  }
}

export class TableRow extends CarbonPlugin {
  name = "tableRowView";

  override spec(): NodeSpec {
    return {
      group: "content",
      isolate: true,
      props: {
        [ContenteditablePath]: false,
      },
    };
  }
}

export class TableColumnNames extends CarbonPlugin {
  name = "tableViewColumnNames";

  override spec(): NodeSpec {
    return {
      group: "content",
      isolate: true,
      content: "text*",
    };
  }
}
