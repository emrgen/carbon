import {Node, NodeFactory, NodeId, NodeIdFactory, Schema} from "@emrgen/carbon-core";
import {Optional} from "@emrgen/types";
import {isEmpty} from "lodash";
import { v4 as uuidv4 } from 'uuid';
import {SolidNodeContent} from "./SolidNodeContent";

let counter = 0;

export class SolidNodeFactory implements NodeFactory {
  static blockId() {
    return uuidv4().slice(-10) + '[' + ++counter + ']';
  }

  static textId() {
    return uuidv4().slice(-10) + '(' + ++counter + ')';
  }

  create(json: any, schema: Schema, nodeIdFactory: NodeIdFactory = SolidNodeFactory): Optional<Node> {
    const { id, name, children = [], text } = json;
    const type = schema.type(name);
    if (!type) {
      throw new Error(`Node Plugin is not registered ${name}`);
    }

    const properties = isEmpty(json.props) ? type.props : type.props.update(json.props);
    const nodeId = id ? NodeId.deserialize(id)! : NodeId.create(nodeIdFactory.textId());
    const nodes = children.map(n => schema.nodeFromJSON(n));
    const content = SolidNodeContent.create({
      id: nodeId,
      type,
      children: nodes,
      props: properties,
      textContent: text,
      parentId: null,
      parent: null,
      links: {},
      linkName: ''
    });
    return new Node(content);
  }

  cloneWithId(node: Node): Node {
    return node.clone()
  }
}
