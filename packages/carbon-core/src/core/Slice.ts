import { Carbon } from "./Carbon";
import {Node, Path} from "./Node";

export class Slice {

  static empty = new Slice(null!, null!, null!);

  get isBlockSelection () {
    return this.start?.isContainer && this.end?.isContainer
  }

  get isEmpty() {
    return this === Slice.empty || !this.root;
  }

  get nodes() {
    return this.root?.children ?? [];
  }

  clonedWIthIds() {
    const {schema} = this.root.type;
    const {factory} = schema;
    // we need to clone the nodes to generate new ids, otherwise the editor will think the copied nodes are the same
    const children = this.root.children.map(n => schema.clone(n, data => {
      return {
        ...data,
        id: factory.blockId()
      }
    }));

    this.root.updateContent(children);
  }

  clone() {
    if (this.isEmpty) {
      return Slice.empty;
    }

    let startPath: Path = [];
    let endPath: Path = [];
    const {root, start, end} = this
    root.all(n => {
      if (n.eq(start)) {
        startPath = n.path
      }
      if (n.eq(end)) {
        endPath = n.path
      }
    })

    // we need to clone the nodes to generate new ids, otherwise the editor will think the copied nodes are the same
    const {schema} = this.root.type;
    const {factory} = schema;
    const cloned = root.type.schema.clone(root, data => {
      return {
        ...data,
        id: factory.blockId()
      }
    });

    const startNode = cloned.atPath(startPath)!;
    const endNode = cloned.atPath(endPath)!;

    return new Slice(cloned, startNode, endNode);
  }

  static from(node: Node) {
    const start = node.find(n => n.isTextContainer, { direction: 'forward', order: 'post' });
    const end = node.find(n => n.isTextContainer, { direction: 'backward', order: 'post' });
    return new Slice(node, start!, end!)
  }

  static create(node: Node, start: Node, end: Node) {
    return new Slice(node, start, end);
  }

  constructor(readonly root: Node, readonly start: Node, readonly end: Node) {}

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
