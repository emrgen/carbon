import { Optional } from "@emrgen/types";
import { each, identity, keys } from "lodash";
import { ContentMatch } from "./ContentMatch";
import { NodeFactory } from "./Factory";
import { Mark, MarkProps } from "./Mark";
import { Node } from "./Node";
import { NodeContentData } from "./NodeContent";
import { MarkType, NodeType } from "./NodeType";
import { Maps, NodeName } from "./types";

interface SchemaSpec {
  nodes: Record<NodeName, NodeSpec>;
}

interface TextNodeOpts {
  props?: Record<string, any>;
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
        throw new Error(`NodeType is not found for ${nodeName}. check if the node plugin is added`);
      }
      if (contentExpr) {
        if (!contextExprCache[contentExpr]) {
          contextExprCache[contentExpr] = ContentMatch.parse(contentExpr, this.nodes);
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

  text(text: string, json: TextNodeOpts = {}): Optional<Node> {
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
    map: Maps<Omit<NodeContentData, "children">, Omit<NodeContentData, "children">> = identity,
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

export enum DragMove {
  x = "x",
  y = "y",
  xy = "xy",
}

export interface NodeSpec {
  name?: string;
  // TODO: splitName should be enough to check if the node is splittable
  content?: string;
  marks?: string;
  group?: string;
  inline?: boolean;
  atom?: boolean;
  tag?: string;
  zero?: boolean;
  options?: boolean;
  focusable?: boolean;
  insert?: {
    focus?: boolean;
  };
  mergeable?: boolean;
  observable?: boolean;
  weakEnd?: boolean;
  splitInside?: boolean;
  // the node can behave like a list item, allowing wrapping, unwrapping, pushed into prev sibling etc.
  nestable?: boolean;
  // when the node content match is not valid
  // the new node will be inserted or the current node will be unwrapped based on the consistency
  consistency?: "insert" | "remove";

  // toDOM?: (node: Node) => [string, any];
  // fromDOM?: (dom: Node) => NodeJSON;

  // the node can be treated as a standalone page
  page?: boolean;
  // last empty children stays within on enter
  // only backspace can unwrap the last child
  collapsible?: boolean;

  normalize?: {
    // what to do when the node is empty
    empty: "remove" | "unwrap" | "insert";
    // fix invalid content match by
    match?: "remove" | "unwrap" | "insert";
  };

  change?: {
    in?: {
      props?: Record<string, any>;
      effect?: "replace" | "insertBefore" | "insertAfter"; // default replace
    };
  };

  split?: {
    inside?: boolean; // default false
    name?: string;
    end?: boolean;
  };

  selection?: {
    inline?: boolean;
    block?: boolean;
    rect?: boolean;
  };
  control?: {
    insert?: boolean;
    collapse?: boolean;
  };
  dnd?: {
    // same as drag handle
    handle?: boolean;
    draggable?: boolean;
    container?: boolean;
    // allows to drop the node within even when there is no children
    nestable?: boolean;
    // top level dnd region
    // no higher dnd region can be found
    region?: boolean;
    // same as rect selectable
    selectable?: boolean;
    // by default this will be evaluated using content match
    accepts?: (parent: Node, child: Node) => boolean;
    // returns draggable node bound
    bound?: NodeName | ((node: Node) => Optional<Node>);
    // draggables can be moved in x, y, xy direction
    move?: "x" | "y" | "xy";
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
    parent?: boolean;
  };

  transform?: {
    translate?: string; // x, y, xy
    resize?: string; // x, y, lt, rt, lb, rb, lx, rx, ty, by, xy
    rotate?: boolean; // true, false
  };

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
  shortcut?: string;
  icon?: string;
  tags?: string[];
  order?: number;
}
