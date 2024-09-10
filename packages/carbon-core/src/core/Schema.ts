import { Optional } from "@emrgen/types";
import { each, identity, keys } from "lodash";
import { ContentMatch } from "./ContentMatch";
import { Node } from "./Node";
import { MarkType, NodeType } from "./NodeType";
import { Maps, NodeName } from "./types";
import { Mark, MarkProps } from "./Mark";
import { NodeContentData, NodeFactory } from "@emrgen/carbon-core";

interface SchemaSpec {
  nodes: Record<NodeName, NodeSpec>;
}

// ref: prosemirror-model/src/schema.js
export class Schema {
  nodes: Record<NodeName, NodeType>;
  marks: Record<NodeName, MarkType>;
  factory: NodeFactory;

  constructor(spec: SchemaSpec, factory: NodeFactory) {
    this.factory = factory;
    this.nodes = NodeType.compile(spec.nodes, this);
    this.marks = {};

    const contextExprCache: any = {};
    for (const nodeName in this.nodes) {
      if (nodeName in this.marks) {
        // console.log(nodeName in this.marks, this.marks);
        throw new RangeError(nodeName + " can not be both a node and a mark");
      }

      const nodeType = this.nodes[nodeName]!;
      const contentExpr = nodeType.spec.content;
      const markExpr = nodeType.spec.marks;
      if (!nodeType) {
        throw new Error(
          `NodeType is not found for ${nodeName}. check if the node plugin is added`,
        );
      }
      if (contentExpr) {
        if (!contextExprCache[contentExpr]) {
          contextExprCache[contentExpr] = ContentMatch.parse(
            contentExpr,
            this.nodes,
          );
        }

        nodeType.contentMatch = contextExprCache[contentExpr];
        nodeType.inlineContent = nodeType.contentMatch.inlineContent;
      } else {
        // console.log('empty content match for', nodeName);
        nodeType.contentMatch = ContentMatch.empty;
        nodeType.inlineContent = false;
      }

      if (markExpr) {
      }
    }

    each(this.nodes, (n) => n.computeContents());
  }

  type(name: string): NodeType {
    const type = this.nodes[name];
    if (!type) {
      console.log(keys(this.nodes), name);
      throw new Error("node type is not found: " + name);
    }
    return type;
  }

  text(text: string, json = {}): Optional<Node> {
    return this.node("text", { text, ...json });
  }

  node(name: string, json = {}): Optional<Node> {
    return this.nodeFromJSON({ name, ...json });
  }

  mark(name: string, props?: MarkProps): Mark {
    return new Mark(name, props);
  }

  clone(
    node: Node,
    map: Maps<
      Omit<NodeContentData, "children">,
      Omit<NodeContentData, "children">
    > = identity,
  ): Node {
    return this.factory.clone(node, map);
  }

  // create node from json
  nodeFromJSON(json: any): Optional<Node> {
    if (json instanceof Node) {
      return json;
    }

    return this.factory.create(json, this);
  }
}

enum DndLayout {
  horizontal,
  vertical,
  grid,
}

export interface NodeSpec {
  name?: string;
  // TODO: splitName should be enough to check if the node is splittable
  splits?: boolean;
  splitName?: string;
  content?: string;
  marks?: string;
  group?: string;
  inline?: boolean;
  atom?: boolean;
  tag?: string;
  zero?: boolean;
  options?: boolean;
  mergeable?: boolean;
  // when the node content match is not valid
  // the new node will be inserted or the current node will be unwrapped based on the consistency
  consistency?: "insert" | "remove";

  // toDOM?: (node: Node) => [string, any];
  // fromDOM?: (dom: Node) => NodeJSON;

  // the node can be treated as a standalone document
  document?: boolean;
  // inline atom wrapper wraps the inline atom with two empty text nodes
  inlineAtomWrapper?: boolean;

  inlineSelectable?: boolean;
  blockSelectable?: boolean;
  rectSelectable?: boolean;

  // last empty children stays within on enter
  // only backspace can unwrap the last child
  collapsible?: boolean;
  selection?: {
    inline?: boolean;
    block?: boolean;
    rect?: boolean;
  };
  dnd?: {
    // same as drag handle
    handle?: boolean;
    draggable?: boolean;
    container?: boolean;
    // same as rect selectable
    selectable?: boolean;
    // by default this will be evaluated using content match
    accepts?: (parent: Node, child: Node) => boolean;
    // returns draggable node bound
    bound?: NodeName | ((node: Node) => Optional<Node>);
    // drag direction constraints
    layout?: DndLayout;
  };

  // if the depends on node content is updated, the node will be updated as well
  depends?: {
    prev?: boolean;
    next?: boolean;
    child?: boolean;
  };
  updates?: {
    prev?: boolean;
    next?: boolean;
    children?: boolean;
  };
  focusable?: boolean;
  draggable?: boolean;
  dragHandle?: boolean;
  insert?: boolean;
  // node is a embedded element
  // it can be a video, audio, external react
  embedded?: boolean;
  // sandbox act as a divider of all interaction with other node
  // sandbox also act as the edge of the interactions
  sandbox?: boolean;
  code?: boolean;
  whitespace?: "pre" | "normal";
  definingAsContext?: boolean;
  definingForContent?: boolean;
  defining?: boolean;
  isolate?: boolean;
  isolateContent?: boolean; // isolate children from title
  pasteBoundary?: boolean;
  insertBefore?: boolean;
  insertAfter?: boolean;
  // used to show block insert info
  info?: NodeInfo;

  props?: Record<string, any>;

  default?: any; //InitNodeJSON,

  [key: string]: any;
}

export interface NodeInfo {
  title?: string;
  description?: string;
  icon?: string;
  tags?: string[];
  order?: number;
}
