import { Optional } from "@emrgen/types";
import { cloneDeep, each, isArray } from "lodash";
import { ContentMatch } from "./ContentMatch";
import { Node } from "./Node";
import { NodeAttrsJSON } from "./NodeAttrs";
import { NodeProps, PlainNodeProps } from "./NodeProps";
import { NodeStateJSON } from "./NodeState";
import { NodeSpec, Schema } from "./Schema";
import { NodeJSON, NodeName } from "./types";

interface InitNodeJSON extends Omit<NodeJSON, "id"> {
  id?: string;
}

const specGroups = (name: string, spec: NodeSpec) => {
  const groups = new Set(spec.group ? spec.group.split(" ") : []);
  const isBlock = !(spec.inline || name == "text");
  if (isBlock) {
    groups.add("block");
  } else {
    groups.add("inline");
  }
  return Array.from(groups);
};

const IDENTITY_NODE_SPEC: NodeSpec = {
  attrs: {},
  group: "",
  content: "",
  marks: "",
  inline: false,
};

interface DefaultParams {
  attrs?: NodeAttrsJSON;
  state?: NodeStateJSON;
}

export class NodeType {
  groupsNames: readonly string[];

  props: NodeProps;

  /// True if this node type has inline content.
  inlineContent!: boolean;
  /// True if this is a block type
  isBlock: boolean;
  /// True if this is the text node type.
  isText: boolean;

  contentMatch!: ContentMatch;

  contents: NodeName[];

  _default: Optional<InitNodeJSON>;

  static IDENTITY = new NodeType("identity", {} as Schema, IDENTITY_NODE_SPEC);
  static NULL = new NodeType("null", {} as Schema, IDENTITY_NODE_SPEC);
  static SKIP = new NodeType("skip", {} as Schema, IDENTITY_NODE_SPEC);

  static compile(specs: Record<NodeName, NodeSpec>, schema: Schema) {
    const nodes = {};
    each(specs, (spec, name) => {
      // console.log(merge(defaultSpec, spec));
      nodes[name] = new NodeType(name, schema, spec);
    });
    return nodes;
  }

  // name: name of the node
  // schema: back reference to editor schema
  // spec: spec of the NodeType
  constructor(
    readonly name: NodeName,
    readonly schema: Schema,
    readonly spec: NodeSpec,
  ) {
    this.groupsNames = specGroups(name, spec);
    this.props = PlainNodeProps.create(spec.props ?? {});

    this.isBlock = !(spec.inline || name == "text");
    this.isText = name == "text";
    this.contents = [];
    this._default = Object.freeze(spec.default);
  }

  computeContents() {
    const { nodes } = this.schema;
    const nodeGroups: Record<string, Set<NodeName>> = {};
    // generate groupName to nodeName map
    // for a nodeName create a temporary group
    each(nodes, (type, name) => {
      if (!type.isDraggable) return;
      nodeGroups[name] = new Set([name]);
      each(type.groups, (groupName) => {
        nodeGroups[groupName] = nodeGroups[groupName] ?? new Set();
        nodeGroups[groupName].add(name);
      });
    });

    const contents: Set<NodeName> = new Set();
    const childGroups = this.spec.content?.match(/[a-zA-Z]+/gi);
    each(childGroups, (childGroupName) => {
      nodeGroups[childGroupName]?.forEach((childName) => {
        contents.add(childName);
      });
    });

    this.contents = Array.from(contents);
  }

  get parents() {
    const parents = new Set();
    each(this.schema.nodes, (n) => {
      if (n.contents.includes(this.name)) {
        parents.add(n.name);
      }
    });

    return parents;
  }

  get Tag() {
    return this.spec.tag ?? "div";
  }

  get groups() {
    return this.groupsNames;
  }

  get dragHandle() {
    return this.spec.dragHandle;
  }

  get isCollapsible() {
    return !!this.spec.collapsible;
  }

  get isContainer() {
    return !!this.spec.container;
  }

  get isDocument() {
    return !!this.spec.document;
  }

  get isBlockSelectable() {
    return !!this.spec.blockSelectable;
  }

  get splits() {
    return !!this.spec.splits;
  }

  get splitName() {
    return this.spec.splitName ?? "section";
  }

  get replaceName() {
    return this.spec.replaceName ?? this.name;
  }

  get canSplit() {
    return false;
    // return [...listNames, 'title'].includes(this.name);
  }

  get isInline() {
    return !this.isBlock;
  }

  get isEmbedding() {
    return !!this.spec.embedding;
  }

  get isTextBlock() {
    return this.isBlock && this.inlineContent;
  }

  get isAtom() {
    return !!this.spec.atom;
  }

  get isZero() {
    return !!this.spec.zero;
  }

  get isPasteBoundary() {
    return !!this.spec.pasteBoundary;
  }

  get isIsolate() {
    return !!this.spec.isolate;
  }

  get isDraggable() {
    return !!this.spec.draggable;
  }

  get dnd() {
    return this.spec.dnd;
  }

  get isDropContainer() {
    return !!this.spec.dropContainer;
  }

  get isInlineSelectable() {
    return !!this.spec.inlineSelectable;
  }

  get isSandbox() {
    return !!this.spec.sandbox;
  }

  get isFocusable() {
    return !!this.spec.focusable;
  }

  get whitespace(): "pre" | "normal" {
    return this.spec.whitespace || (this.spec.code ? "pre" : "normal");
  }

  get isLeaf() {
    return this.contentMatch == ContentMatch.empty;
  }

  hasRequiredAttrs() {
    // console.warn('hasRequiredAttrs is not implemented');
    return false;
  }

  // create a default node based on schema
  default(): Optional<Node> {
    if (this._default) {
      console.log("returning cached default", this._default);
      return this.schema.nodeFromJSON(cloneDeep(this._default));
    }

    const node = this.createAndFill();
    if (!node) {
      return null;
    }

    // save the default for future use
    this._default = Object.freeze(this.removeNodeId(node.toJSON()));

    return node;
  }

  private removeNodeId(json: NodeJSON): InitNodeJSON {
    const { id, ...rest } = json;
    return {
      ...rest,
      children: json.children?.map((c) => this.removeNodeId(c)),
    };
  }

  create(content: Node[] | string, props = {}): Optional<Node> {
    if (this.isText) {
      return this.schema.text(content as string, { props });
    }

    return this.schema.node(this.name, { children: content as Node[], props });
  }

  eq(other: NodeType) {
    return this.name === other.name;
  }

  defaultNodeCache: Optional<Node>;

  createAndFill(): Optional<Node> {
    if (this.defaultNodeCache) {
      console.log("returning cached default node", this.defaultNodeCache);
      return this.schema.clone(this.defaultNodeCache, (n) => {
        return {
          ...n,
          id: this.schema.factory.blockId(),
        };
      });
    }

    if (this.isText) {
      const node = this.schema.text("");
      this.defaultNodeCache = node?.toJSON();
      return node;
    }

    const blockJson: InitNodeJSON = {
      name: this.name,
      children: [],
    };
    let { contentMatch } = this;
    if (contentMatch.validEnd) {
      return this.schema.nodeFromJSON(blockJson);
    }

    while (contentMatch) {
      let { next: nextEdges, defaultType, validEnd } = contentMatch;
      if (validEnd || !nextEdges) {
        break;
      }
      if (defaultType && isArray(blockJson.children)) {
        blockJson.children.push(defaultType.default()?.toJSON());
      }
      contentMatch = nextEdges[0].next;
    }

    const node = this.schema.nodeFromJSON(blockJson);
    if (!node) {
      throw new Error("node is null");
    }

    this.defaultNodeCache = node;

    return node;
  }
}

export class MarkType {}
