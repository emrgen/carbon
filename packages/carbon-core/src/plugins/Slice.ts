import {CarbonPlugin, Node, NodeEncoder, NodeSpec, Writer} from "../core";

/**
 * Slice is a special node that represents a selection of nodes in the page.
 * It is used to represent the selection in the editor and to copy and paste content.
 * The content of a slice is a list of nodes that are selected in the page.
 **/
export class SliceNode extends CarbonPlugin {
  static kind = "slice";

  name = "slice";

  spec(): NodeSpec {
    return {
      content: "content+",
    };
  }

  encode(w: Writer, ne: NodeEncoder, node: Node) {
    node.children.forEach((n) => {
      ne.encode(w, n);
    });
  }

  encodeHtml(w: Writer, ne: NodeEncoder, node: Node) {
    node.children.forEach((n) => {
      ne.encodeHtml(w, n);
    });
  }
}
