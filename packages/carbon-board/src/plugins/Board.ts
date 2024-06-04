import {
  CarbonPlugin,
  ClassPathLocal,
  IntoNodeId,
  NodeSpec,
  SelectedPath,
  Transaction,
} from "@emrgen/carbon-core";

declare module "@emrgen/carbon-core" {
  interface Transaction {
    sqBoard: {
      selectItems(items: IntoNodeId[]): void;
    };
  }
}

export class Board extends CarbonPlugin {
  name = "sqBoard";

  spec(): NodeSpec {
    return {
      group: "content",
      content: "sqItem+",
      isolate: true,
    };
  }

  plugins(): CarbonPlugin[] {
    return [new Column(), new Note()];
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
      content: "sqColumnItem+",
      isolate: true,
      props: {
        [ClassPathLocal]: "sqItem",
      },
    };
  }
}

export class Note extends CarbonPlugin {
  name = "sqNote";

  spec(): NodeSpec {
    return {
      group: "sqItem sqColumnItem",
      content: "(section | todo | bulletList)+",
      isolate: true,
      props: {
        [ClassPathLocal]: "sqItem",
      },
    };
  }
}
