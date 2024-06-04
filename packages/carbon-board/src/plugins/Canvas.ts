import {
  CarbonPlugin,
  IntoNodeId,
  NodeSpec,
  SelectedPath,
  Transaction,
} from "@emrgen/carbon-core";
import { TitlePlugin } from "@emrgen/carbon-blocks";

declare module "@emrgen/carbon-core" {
  interface Transaction {
    sqBoard: {
      selectItems(items: IntoNodeId[]): void;
    };
  }
}

export class Canvas extends CarbonPlugin {
  name = "sqCanvas";

  spec(): NodeSpec {
    return {
      group: "content",
      content: "sqItem+",
      isolate: true,
    };
  }

  plugins(): CarbonPlugin[] {
    return [new Column(), new Note(), new Board(), new Title()];
  }

  commands(): Record<string, Function> {
    return {
      selectItems: this.selectItems,
      deselectItems: this.deselectItems,
      activateItem: this.activateItem,
      deactivateItems: this.deactivateItems,
    };
  }

  selectItems(tr: Transaction, nodes: IntoNodeId[]) {
    nodes.forEach((node) => {
      tr.Update(node, { [SelectedPath]: true });
    });
  }

  deselectItems(tr: Transaction, nodes: IntoNodeId[]) {
    nodes.forEach((node: IntoNodeId) => {
      tr.Update(node, { [SelectedPath]: false });
    });
  }

  activateItem(tr: Transaction, node: IntoNodeId) {
    tr.Update(node, { [SelectedPath]: true });
  }

  deactivateItems(tr: Transaction, node: IntoNodeId[]) {
    node.forEach((node) => {
      tr.Update(node, { [SelectedPath]: false });
    });
  }
}

export class Column extends CarbonPlugin {
  name = "sqColumn";

  spec(): NodeSpec {
    return {
      group: "sqItem",
      content: "sqTitle sqColumnItem+",
      isolate: true,
      props: {
        local: {
          html: {
            suppressContentEditableWarning: true,
            contentEditable: false,
            className: "sqItem",
          },
        },
      },
    };
  }
}

export class Board extends CarbonPlugin {
  name = "sqBoard";

  spec(): NodeSpec {
    return {
      group: "sqItem sqColumnItem",
      content: "sqTitle",
      isolate: true,
      props: {
        local: {
          html: {
            suppressContentEditableWarning: true,
            contentEditable: false,
            className: "sqItem",
          },
        },
      },
    };
  }
}

export class Note extends CarbonPlugin {
  name = "sqNote";

  spec(): NodeSpec {
    return {
      group: "sqItem sqColumnItem sqCard",
      content: "(section | todo | bulletList)+",
      isolate: true,
      props: {
        local: {
          html: {
            suppressContentEditableWarning: true,
            className: "sqItem",
            contentEditable: false,
          },
        },
      },
    };
  }
}

export class Title extends TitlePlugin {
  name = "sqTitle";

  spec(): NodeSpec {
    return {
      ...super.spec(),
      group: "",
      isolate: true,
      props: {
        local: {
          html: {
            suppressContentEditableWarning: true,
          },
        },
      },
    };
  }
}
