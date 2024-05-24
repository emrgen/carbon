import { Node } from "@emrgen/carbon-core";

export class InlineNode {
  private readonly node: Node;

  static from = (node: Node): InlineNode => {
    return new InlineNode(node);
  };

  constructor(node: Node) {
    if (!node.isInline) {
      throw new Error("Node must be inline");
    }

    this.node = node;
  }

  split(offset: number): Node[] {
    const { node } = this;
    const { type, textContent } = node;
    if (offset <= 0 || offset >= textContent.length) {
      console.warn("Split offset is invalid", offset, textContent.length);
      return [node];
    }

    const before = textContent.slice(0, offset);
    const after = textContent.slice(offset);

    const prev = type.create(before, node.props.toJSON());
    const next = type.create(after, node.props.toJSON());

    if (!prev || !next) {
      console.warn("Split failed", prev, next);
      return [node];
    }

    console.log("XXX", prev.props.toJSON(), node.props.toJSON());

    return [prev, next];
  }
}
