import { SolidNode } from './SolidNode';
import {BlockContent, InlineContent, Node, NodeFactory, NodeId, NodeIdFactory, Schema} from "@emrgen/carbon-core";
import {Optional} from "@emrgen/types";
import {isEmpty} from "lodash";

export class SolidNodeFactory extends NodeFactory {
  override	createNode(json: any, schema: Schema, nodeIdFactory: NodeIdFactory = NodeFactory): Optional<Node> {
    const { id, name, children = [], text } = json;
    const type = schema.type(name);
    if (!type) {
      throw new Error(`Node Plugin is not registered ${name}`);
    }

    const properties = isEmpty(json.props) ? type.props : type.props.update(json.props);

    if (name === 'text') {
      const content = InlineContent.create(text);
      const nodeId = id ? NodeId.deserialize(id)! : NodeId.create(nodeIdFactory.textId());
      return SolidNode.create({ id: nodeId, type, content, properties });
    } else {
      const nodes = children.map(n => schema.nodeFromJSON(n));
      const content = BlockContent.create(nodes);
      const nodeId = id ? NodeId.deserialize(id)! : NodeId.create(nodeIdFactory.blockId());
      return SolidNode.create({ id: nodeId, type, content, properties });
    }
  }

  override cloneWithId(node: SolidNode): SolidNode {
    return node.clone()
  }
}
