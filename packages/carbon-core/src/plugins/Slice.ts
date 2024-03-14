import {Carbon, CarbonPlugin, Node, NodeEncoder, NodeSpec, SerializedNode, Writer} from "../core";

export class SlicePlugin extends CarbonPlugin {

  name = 'slice';

  spec(): NodeSpec {
    return {
      content: 'content+'
    }
  }

  encode(w: Writer, ne: NodeEncoder, node: Node) {
    node.children.forEach(n => {
      ne.encode(w, n);
    });
  }

  encodeHtml(w: Writer, ne: NodeEncoder, node: Node) {
    node.children.forEach(n => {
      ne.encodeHtml(w, n);
    });
  }
}
