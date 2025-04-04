import {Node, NodeFactory, NodeId, Schema} from "@emrgen/carbon-core";
import {Optional} from "@emrgen/types";
import {isEmpty} from "lodash";
import {VueNodeContent} from "./VueNodeContent";
import { v4 as uuidv4 } from 'uuid';

let counter = 0;

export class VueNodeFactory implements NodeFactory {
  blockId() {
    return NodeId.fromString(uuidv4().slice(-10) + '[' + ++counter + ']');
  }

  textId() {
    return NodeId.fromString(uuidv4().slice(-10) + '(' + ++counter + ')');
  }

  create(json: any, schema: Schema): Optional<Node> {
    const { id, name, children = [], text } = json;
    const type = schema.type(name);
    if (!type) {
      throw new Error(`Node Plugin is not registered ${name}`);
    }

    const properties = isEmpty(json.props) ? type.props.clone() : type.props.merge(json.props);
    const nodeId = id ? NodeId.deserialize(id)! : type.isText ? this.textId() : this.blockId();
    const nodes = children.map(n => schema.nodeFromJSON(n));
    const content = VueNodeContent.create({
      id: nodeId,
      type,
      children: nodes,
      props: properties,
      textContent: text,
      parentId: null,
      parent: null,
      links: {},
      linkName: '',
      contentVersion: 0,
      renderVersion: 0,
    });

    const node = new Node(content);
    nodes.forEach(n => {
      n.setParent(node);
      n?.setParentId(node.id);
    });

    return node;
  }

  clone(node: Node): Node {
    return node.clone()
  }

}
