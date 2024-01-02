import { Node } from "./Node";
import { JSONNode, MarkdownNode, NodeEncoder } from "./types";
import { Carbon } from './Carbon';
import { Optional } from '@emrgen/types';

export class NodeEncoderJSON implements NodeEncoder<JSONNode> {
  encode(node: Node): JSONNode {
    return {
      id: node.id.toString(),
      name: node.name,
      content: node.children.map(n => this.encode(n)),
      attrs: node.props,
      // data: node.data
    }
  }

  decode(node: JSONNode): Optional<Node> {
    return null;
  }
}


export class NodeEncoderMarkdown implements NodeEncoder<MarkdownNode> {
  encode(node: Node): string {
    return node.name;
  }

  decode(node: string): Optional<Node> {
    // return react.schema.nodeFromMarkdown(node);
    return null;
  }
}
