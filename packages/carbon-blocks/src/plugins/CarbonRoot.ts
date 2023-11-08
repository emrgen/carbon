import { Carbon, CarbonPlugin, Node, NodeSpec, SerializedNode } from "@emrgen/carbon-core";
import { identity } from "lodash";

export class CarbonRoot extends CarbonPlugin {

  name = 'carbon';

  spec(): NodeSpec {
    return {
      // group: '',
      // content: 'carbon',
      // focusable: true,
      attrs: {
        html: {
          suppressContentEditableWarning: true,
        }
      }
    }
  }

  serialize(app: Carbon, node: Node): SerializedNode {
    return node.children.map(n => app.serialize(n)).join('\n');
  }
}
