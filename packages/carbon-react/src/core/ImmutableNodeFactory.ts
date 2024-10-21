import { Optional } from "@emrgen/types";

import {
  IDENTITY_SCOPE,
  Maps,
  Node,
  NodeContentData,
  NodeFactory,
  NodeId,
  Schema,
} from "@emrgen/carbon-core";
import { NodeFactoryOptions } from "@emrgen/carbon-core";
import { Fragment } from "@emrgen/carbon-core";
import { MarksPath } from "@emrgen/carbon-core";
import { identity, isArray, isEmpty } from "lodash";
import { ImmutableNode } from "./ImmutableNode";
import { ImmutableNodeContent } from "./ImmutableNodeContent";

let counter = 0;

export class ImmutableNodeFactory implements NodeFactory {
  scope: Symbol;
  private readonly createId: () => string;

  blockId() {
    return NodeId.fromString(this.createId() + "" + ++counter + "");
  }

  textId() {
    return NodeId.fromString(this.createId() + "_" + ++counter + "");
  }

  constructor(
    scope: Symbol = IDENTITY_SCOPE,
    createId = () => "", //uuidv4().slice(-2),
    readonly opts: NodeFactoryOptions = {},
  ) {
    this.scope = scope;
    this.createId = createId;
  }

  create(json: any, schema: Schema): Optional<Node> {
    const { scope } = this;
    const { id, name, children = [], links = {}, text } = json;
    const type = schema.type(name);
    if (!type) {
      throw new Error(`Node Plugin is not registered ${name}`);
    }

    if (!isArray(children)) {
      throw new Error(`Children must be an array`);
    }

    const props = isEmpty(json.props)
      ? type.props.clone()
      : type.props.clone().merge(json.props);
    if (!props.get(MarksPath)) {
      props.set(MarksPath, []);
    }
    const nodeId = id ? NodeId.deserialize(id)! : this.blockId();
    const nodes = children.map((n) => schema.nodeFromJSON(n)) as Node[];

    if (nodes.filter(identity).length !== children.length) {
      throw new Error(
        `Failed to create children. Check if all expected node Plugins are registered.`,
      );
    }

    if (this.opts.strict) {
      const match = type.contentMatch.matchFragment(Fragment.from(nodes));
      if (!match) {
        throw new Error(`Failed to match content for ${name}`);
      }
      if (!match.validEnd) {
        throw new Error(`Invalid content match for ${name}`);
      }
    }

    const content = ImmutableNodeContent.create(scope, {
      id: nodeId,
      type,
      props,
      children: nodes,
      textContent: text,
      links: {},
      linkName: "",
      parentId: null,
      parent: null,
    });

    const node = ImmutableNode.create(scope, content);
    node.children.forEach((n, i) => {
      n.setParentId(node.id);
      n.setParent(node);
      const imn = n as ImmutableNode;
      imn.mappedIndex = i;
    });

    Object.entries(links).forEach(([name, json]) => {
      const child = schema.nodeFromJSON(json);
      if (!child) {
        throw new Error(`Node Plugin is not registered ${name}`);
      }

      console.log("addLink", name, child.id, child.name);
      node.addLink(name, child);
    });

    return node;
  }

  // clone node with new mapped content
  clone(
    node: Node,
    map: Maps<
      Omit<NodeContentData, "children">,
      Omit<NodeContentData, "children">
    >,
  ): Node {
    const { scope } = this;
    const clone = ImmutableNode.create(
      scope,
      ImmutableNodeContent.create(scope, {
        ...map(node.unwrap()),
        children: node.children.map((n) => this.clone(n, map)),
      }),
    );

    // update children parent
    clone.children.forEach((n) => {
      n.setParentId(clone.id);
      n.setParent(clone);
    });

    clone.setParent(null);
    clone.setParentId(null);

    return clone;
  }
}
