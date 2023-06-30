import { Node } from "./Node";
import { first, last } from 'lodash';

export class Slice {

  static empty = new Slice([], null!, null!);

  get isBlockSelection () {
    return this.start?.isContainerBlock && this.end?.isContainerBlock
  }

  get isEmpty() {
    return this.nodes.length === 0  || this === Slice.empty;
  }

  static from(nodes: Node[]) {
    return new Slice(nodes, first(nodes)!, last(nodes)!)
  }


  static create(nodes: Node[], start: Node, end: Node) {
    return new Slice(nodes, start, end);
  }

  constructor(readonly nodes: Node[], readonly start: Node, readonly end: Node) {}
}
