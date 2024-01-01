import {Node} from "@emrgen/carbon-core";

export class Block {
  static isText(node: Node) {
    return node.type.isText;
  }
}
