import {
  Fragment,
  IDENTITY_SCOPE,
  Maps,
  MarksPath,
  Node,
  NodeContentData,
  NodeFactory,
  NodeFactoryOptions,
  NodeId,
  SandboxedProps,
  Schema,
  TitleNode,
} from "@emrgen/carbon-core";
import {Optional} from "@emrgen/types";
import {cloneDeep, entries, identity, isArray, isEmpty} from "lodash";
import {ImmutableNode} from "./ImmutableNode";
import {ImmutableNodeContent} from "./ImmutableNodeContent";

let counter = 0;

const shortId = () => {
  return Math.random().toString(36).substr(2, 9);
};

export class ImmutableNodeFactory implements NodeFactory {
  scope: Symbol;
  private readonly createId: () => string;

  blockId() {
    return NodeId.fromString(this.createId() + "" + shortId() + "");
  }

  textId() {
    return NodeId.fromString(this.createId() + "_" + shortId() + "");
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

    const props = isEmpty(json.props) ? type.props.clone() : type.props.clone().merge(json.props);

    if (!props.get(MarksPath)) {
      props.set(MarksPath, []);
    }
    const nodeId = id ? NodeId.deserialize(id)! : this.blockId();
    const nodes = children.map((n) => schema.nodeFromJSON(n)) as Node[];

    // NOTE: inject props linked node for node spec with `isSandbox`
    if (type.isSandbox && !links[SandboxedProps]) {
      links[SandboxedProps] = {
        name: SandboxedProps,
        props: cloneDeep(json.props ?? {}),
      };
    }

    const linked = entries(links).reduce((obj, [name, json]) => {
      obj[name] = schema.nodeFromJSON(json);
      return obj;
    }, {});

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

    const normalized = type.groups.includes("title")
      ? TitleNode.normalizeNodeContent(nodes)
      : nodes;

    const content = ImmutableNodeContent.create(scope, {
      id: nodeId,
      type,
      props,
      children: normalized,
      textContent: text,
      links: linked,
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

    entries(links).forEach(([name, json]) => {
      const child = schema.nodeFromJSON(json);
      if (!child) {
        throw new Error(`Node Plugin is not registered ${name}`);
      }

      node.addLink(name, child);
    });

    return node;
  }

  // clone node with new mapped content
  clone(
    node: Node,
    map: Maps<Omit<NodeContentData, "children">, Omit<NodeContentData, "children">>,
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
