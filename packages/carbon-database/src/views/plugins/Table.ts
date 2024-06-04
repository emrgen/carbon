import {
  CarbonPlugin,
  ContenteditablePath,
  NodeSpec,
} from "@emrgen/carbon-core";
import { DbLinkPath, TableColumnsLink } from "../../constants";

// This is a simple plugin that defines a TableView node type.
export class TableView extends CarbonPlugin {
  name = "table";

  override spec(): NodeSpec {
    return {
      group: "content",
      content: "tableRow+",
      isolate: true,

      // This is the default node data for a TableView block
      default: {
        name: "table",
        links: {
          [TableColumnsLink]: {
            name: "tableHeader",
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
    return [new TableRow(), new TableHeader(), new TableColumn()];
  }
}

export class TableRow extends CarbonPlugin {
  name = "tableRow";

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

export class TableHeader extends CarbonPlugin {
  name = "tableHeader";

  override spec(): NodeSpec {
    return {
      group: "",
      content: "tableColumn+",
      isolate: true,
    };
  }
}

export class TableColumn extends CarbonPlugin {
  name = "tableColumn";

  override spec(): NodeSpec {
    return {
      group: "content",
      isolate: true,
      content: "text*",
    };
  }
}
