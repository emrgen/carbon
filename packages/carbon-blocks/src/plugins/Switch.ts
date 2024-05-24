import {
  CarbonPlugin,
  CheckedPath,
  Node,
  Transaction,
} from "@emrgen/carbon-core";

declare module "@emrgen/carbon-core" {
  export interface Node {}

  export interface Transaction {
    switch: {
      // switch takes node as argument instead of id because it's we need to check if the node is checked or not
      toggle(node: Node): Transaction;
      on(node: Node): Transaction;
      off(node: Node): Transaction;
    };
  }
}

export class Switch extends CarbonPlugin {
  name = "switch";

  commands(): Record<string, Function> {
    return {
      toggle: this.toggle,
      on: this.handlers,
      off: this.off,
    };
  }

  toggle(tr: Transaction, node: Node) {
    tr.Update(node.id, {
      [CheckedPath]: !this.isChecked(node),
    }).Dispatch();
  }

  on(tr: Transaction, node: Node) {
    tr.Update(node.id, {
      [CheckedPath]: true,
    }).Dispatch();
  }

  off(tr: Transaction, node: Node) {
    tr.Update(node.id, {
      [CheckedPath]: false,
    }).Dispatch();
  }

  isChecked(node: Node) {
    return node.props.get<boolean>(CheckedPath);
  }
}
