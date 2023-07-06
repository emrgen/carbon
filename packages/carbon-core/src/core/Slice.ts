import { Carbon } from "./Carbon";
import { Node } from "./Node";
import { first, last } from 'lodash';

export class Slice {

  static empty = new Slice(null!, null!, null!);

  get isBlockSelection () {
    return this.start?.isContainerBlock && this.end?.isContainerBlock
  }

  get isEmpty() {
    return this === Slice.empty;
  }

  get nodes() {
    return this.root?.children ?? [];
  }

  clone(app: Carbon) {
    let startPath: number[] = [];
    let endPath: number[] = [];
    const {root, start, end} = this
    root.forAll(n => {
      if (n.eq(start)) {
        startPath = n.path
      }
      if (n.eq(end)) {
        endPath = n.path
      }
    })

    const cloned = app.schema.cloneWithId(root);
    const startNode = cloned.atPath(startPath)!;
    const endNode = cloned.atPath(endPath)!;
    
    return new Slice(cloned, startNode, endNode);
  }

  static from(node: Node) {
    const start = node.find(n => n.isTextBlock, { direction: 'forward', order: 'post' });
    const end = node.find(n => n.isTextBlock, { direction: 'backward', order: 'post' });
    return new Slice(node, start!, end!)
  }

  static create(node: Node, start: Node, end: Node) {
    return new Slice(node, start, end);
  }

  constructor(readonly root: Node, readonly start: Node, readonly end: Node) {}
}
