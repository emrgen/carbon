import {
  CarbonPlugin,
  Node,
  NodeEncoder,
  NodeSpec,
  Writer,
} from "@emrgen/carbon-core";

export class CarbonRoot extends CarbonPlugin {
  name = "carbon";

  spec(): NodeSpec {
    return {
      // group: '',
      // content: 'carbon',
      // focusable: true,
      props: {
        local: {
          html: {
            suppressContentEditableWarning: true,
            className: "croot",
          },
        },
      },
    };
  }

  encode(w: Writer, ne: NodeEncoder, node: Node) {
    node.children.forEach((child) => {
      ne.encode(w, child);
    });
  }

  encodeHtml(w: Writer, ne: NodeEncoder, node: Node) {
    node.children.forEach((child) => {
      ne.encodeHtml(w, child);
    });
  }
}
