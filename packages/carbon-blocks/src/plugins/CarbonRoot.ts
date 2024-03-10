import {Carbon, CarbonPlugin, Node, NodeEncoder, NodeSpec, SerializedNode, Writer} from "@emrgen/carbon-core";
import { identity } from "lodash";

export class CarbonRoot extends CarbonPlugin {

  name = 'carbon';

  spec(): NodeSpec {
    return {
      // group: '',
      // content: 'carbon',
      // focusable: true,
      props: {
        local: {
          html: {
            suppressContentEditableWarning: true,
          }
        }
      }
    }
  }

  encode(w: Writer, ne: NodeEncoder<string>, node: Node) {
    node.children.forEach(child => {
      ne.encode(w, child);
    });
  }

  encodeHtml(w: Writer, ne: NodeEncoder<string>, node: Node) {
    node.children.forEach(child => {
      ne.encodeHtml(w, child);
    });
  }

}
