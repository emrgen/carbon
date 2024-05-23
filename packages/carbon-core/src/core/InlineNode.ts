import { Node } from "@emrgen/carbon-core";

export class InlineNode {
  private readonly node: Node;

  static from = (node: Node): InlineNode => {
    return new InlineNode(node);
  };

  constructor(node: Node) {
    this.node = node;
  }

  split(offset: number): Node[] {
    return [this.node];
  }
}
