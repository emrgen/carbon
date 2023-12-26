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
    return uuidv4().slice(-10) + '[' + ++counter + ']';
  }

  textId() {
    return uuidv4().slice(-10) + '(' + ++counter + ')';
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

    const properties = isEmpty(json.props) ? type.props : type.props.update(json.props);
    const nodeId = id ? NodeId.deserialize(id)! : NodeId.create(this.blockId());
    const nodes = children.map(n => schema.nodeFromJSON(n));
    const content = ImmutableNodeContent.create(scope, {
      id: nodeId,
      type,
      props: properties,
      children: nodes,
      textContent: text,
      links: {},
      linkName: '',
      parentId: null,
      parent: null
    });

    return ImmutableNode.create(scope, content);
  }

  // clone node with new id
  clone(node: Node, map: Maps<Omit<NodeData, 'children'>, Omit<NodeData, 'children'>>): Node {
    const {scope} = this;
    const clone = ImmutableNode.create(scope, ImmutableNodeContent.create(scope, {
      ...map(node.unwrap()),
      children: node.children.map(n => this.clone(n, map))
    }));

    clone.setParent(null);
    clone.setParentId(null);

    return clone;
  }
}
