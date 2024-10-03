import { Node } from "./Node";

export class Block {
  static isText(node: Node) {
    return node.type.isText;
  }
}

// @ts-ignore
// window.Block = Block;
