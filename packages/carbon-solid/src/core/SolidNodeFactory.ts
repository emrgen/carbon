import {Maps, MarkSet, Node, NodeContentData, NodeFactory, NodeId, Schema} from "@emrgen/carbon-core";
import {Optional} from "@emrgen/types";
import {isEmpty} from "lodash";
import { v4 as uuidv4 } from 'uuid';
import {SolidNodeContent} from "./SolidNodeContent";
import {SolidNode} from "./SolidNode";
import {SolidNodeMap} from "./NodeMap";

let counter = 0;

export class SolidNodeFactory implements NodeFactory {
  blockId() {
    return NodeId.create(uuidv4().slice(-10) + '[' + ++counter + ']');
  }

  textId() {
    return NodeId.create(uuidv4().slice(-10) + '(' + ++counter + ')');
  }

  create(json: any, schema: Schema): Optional<Node> {
    const { id, name, children = [], text } = json;
    const type = schema.type(name);
    if (!type) {
      throw new Error(`Node Plugin is not registered ${name}`);
    }

    const properties = isEmpty(json.props) ? type.props : type.props.update(json.props);
    const nodeId = id ? NodeId.deserialize(id)! : this.textId();
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
      linkName: '',
      marks: MarkSet.empty(),
    });

    const node = new SolidNode(content);
    node.children.forEach((n: Node) => {
      n.setParent(node);
      n.setParentId(node.id);
    });

    return node;
  }

  clone(node: Node, map: Maps<Omit<NodeContentData, 'children'>, Omit<NodeContentData, 'children'>>): Node {
    const clone = new SolidNode(SolidNodeContent.create({
      ...map(node.unwrap()),
      children: node.children.map(n => this.clone(n, map))
    }));

    // update children parent
    clone.children.forEach(n => {
      n.setParentId(clone.id);
      n.setParent(clone);
    });


    console.debug('setting parent to be null', node.id.toString())
    // clone.setParent(null);
    // clone.setParentId(null);

    return clone;
  }
}
