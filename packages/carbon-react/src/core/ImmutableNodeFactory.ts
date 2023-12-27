import {Optional} from '@emrgen/types';

import {
  IDENTITY_SCOPE,
  Schema,
  Node,
  NodeId,
  NodeFactory, Maps, NodeData,
} from "@emrgen/carbon-core";
import {isEmpty} from "lodash";
import {v4 as uuidv4} from 'uuid';
import {ImmutableNode} from "./ImmutableNode";
import {ImmutableNodeContent} from "./ImmutableNodeContent";

let counter = 0;

export class ImmutableNodeFactory implements NodeFactory {
  scope: Symbol;

  blockId() {
    return NodeId.create(uuidv4().slice(-10) + '[' + ++counter + ']');
  }

  textId() {
    return NodeId.create(uuidv4().slice(-10) + '(' + ++counter + ')');
  }

  constructor(scope: Symbol = IDENTITY_SCOPE) {
    this.scope = scope;
  }

  create(json: any, schema: Schema): Optional<Node> {
    const {scope} = this;
    const {id, name, children = [], text} = json;
    const type = schema.type(name);
    if (!type) {
      throw new Error(`Node Plugin is not registered ${name}`);
    }

    const props = isEmpty(json.props) ? type.props : type.props.clone().update(json.props);
    const nodeId = id ? NodeId.deserialize(id)! : this.blockId();
    const nodes = children.map(n => schema.nodeFromJSON(n));
    const content = ImmutableNodeContent.create(scope, {
      id: nodeId,
      type,
      props,
      children: nodes,
      textContent: text,
      links: {},
      linkName: '',
      parentId: null,
      parent: null
    });

    const node = ImmutableNode.create(scope, content);
    node.children.forEach(n => {
      n.setParentId(node.id)
      n.setParent(node)
    });

    return node;
  }

  // clone node with new id
  clone(node: Node, map: Maps<Omit<NodeData, 'children'>, Omit<NodeData, 'children'>>): Node {
    const {scope} = this;
    const clone = ImmutableNode.create(scope, ImmutableNodeContent.create(scope, {
      ...map(node.unwrap()),
      children: node.children.map(n => this.clone(n, map))
    }));

    // update children parent
    clone.children.forEach(n => {
      n.setParentId(clone.id);
      n.setParent(clone);
    });

    clone.setParent(null);
    clone.setParentId(null);

    return clone;
  }
}
