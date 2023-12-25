import { Carbon, CarbonPlugin, Node, NodeSpec, SerializedNode } from "@emrgen/carbon-core";
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

  // serialize(react: Carbon, node: Node): SerializedNode {
  //   return node.children.map(n => react.serialize(n)).join('\n');
  // }
}
