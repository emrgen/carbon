import { Node, Path } from "./Node";
import { Fragment, LocalClassPath } from "@emrgen/carbon-core";
import { flatten, zip } from "lodash";

// Slice represents a selection of nodes in the editor
// it is used to store the current selection and to copy and paste nodes
// when the start and end nodes both are containers, it represents a block selection
export class Slice {
  static empty = new Slice(null!, null!, null!);

  get isBlockSelection() {
    return this.start?.isContainer && this.end?.isContainer;
  }

  get isEmpty() {
    return this === Slice.empty || !this.root;
  }

  get nodes() {
    return this.root?.children ?? [];
  }

  clone() {
    if (this.isEmpty) {
      return Slice.empty;
    }

    let startPath: Path = [];
    let endPath: Path = [];
    const { root, start, end } = this;
    root.all((n) => {
      if (n.eq(start)) {
        startPath = n.path;
      }
      if (n.eq(end)) {
        endPath = n.path;
      }
    });

    // we need to clone the nodes to generate new ids, otherwise the editor will think the copied nodes are the same
    const { schema } = this.root.type;
    const { factory } = schema;
    const cloned = root.type.schema.clone(root, (data) => {
      return {
        ...data,
        id: factory.blockId(),
      };
    });

    if (this.isBlockSelection) {
      return new Slice(cloned, cloned.firstChild!, cloned.lastChild!);
    }

    const startNode = cloned.atPath(startPath)!;
    const endNode = cloned.atPath(endPath)!;

    return new Slice(cloned, startNode, endNode);
  }

  normalize() {
    if (this.isEmpty) {
      return Slice.empty;
    }

    const normalized = this.normalizeChildren(this.nodes);
    const removeCodeNodes = this.transformCodeNodes(normalized);
    this.root.updateContent(removeCodeNodes);
  }

  // FIXME: replace code>codeTitle with section>title otherwise the paste is creating a code block
  // also remove all CodeTClassPathLocal from the children
  transformCodeNodes(nodes: Node[]) {
    return nodes.map((n) => {
      n.updateProps({
        [LocalClassPath]: "",
      });

      if (n.type.name === "codeTitle") {
        return n.type.schema.nodeFromJSON({
          id: n.id.toString(),
          name: "title",
          children: this.transformCodeNodes(n.children),
        });
      }

      if (n.type.name === "code") {
        return n.type.schema.nodeFromJSON({
          id: n.id.toString(),
          name: "section",
          children: this.transformCodeNodes(n.children),
        });
      }

      return n.clone((data) => ({
        ...data,
        children: this.transformCodeNodes(data.children),
      }));
    });
  }

  // TODO: this is a hack to fix the issue with invalid end nodes
  // we need to find a better way to fix this
  // the problem is that the schema is not strict enough
  normalizeChildren(nodes: Node[]) {
    const normalized = flatten(
      nodes.map((n) => {
        const contentMatch = n.type.contentMatch;
        const match = contentMatch.matchFragment(Fragment.from(n.children));
        if (match?.validEnd) {
          return [n];
        } else {
          console.log(
            "invalid end",
            n.type.name,
            n.children.map((n) => n.type.name).join(" > "),
          );
          return n.children;
        }
      }),
    );

    if (
      nodes.length === normalized.length &&
      zip(nodes, normalized).every(([a, b]) => a!.eq(b!))
    ) {
      return normalized;
    }

    return this.normalizeChildren(normalized);
  }

  static from(node: Node) {
    const start = node.find((n) => n.isTextContainer, {
      direction: "forward",
      order: "post",
    });
    const end = node.find((n) => n.isTextContainer, {
      direction: "backward",
      order: "post",
    });
    return new Slice(node, start!, end!);
  }

  static create(node: Node, start: Node, end: Node) {
    return new Slice(node, start, end);
  }

  constructor(
    readonly root: Node,
    readonly start: Node,
    readonly end: Node,
  ) {}

  freeze() {
    Object.freeze(this);
    Object.freeze(this.root);
  }

  toJSON() {
    return {
      root: this.root.toJSON(),
      start: this.start.toJSON(),
      end: this.end.toJSON(),
    };
  }
}
