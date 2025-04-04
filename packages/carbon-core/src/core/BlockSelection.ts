// separated block selection from pinned/pointed selection
// because its a different concept and it's not clear how to combine them
// for example, if we have a block selection and then we point to a node inside the block selection
// what should happen? should we select the node or should we extend the block selection?
// should we have a separate block selection and a separate pointed selection?
// how to have block selection and pointed selection at the same time, are we allowed to do that?
// how to reset block selection without resetting pointed selection?
import {sortNodes} from "../utils/node";
import {Node} from "./Node";

export class BlockSelection {
  readonly blocks: Node[];

  static is(node: any) {
    return node instanceof BlockSelection;
  }

  static empty() {
    return new BlockSelection([]);
  }

  static create(nodes: Node[]) {
    return new BlockSelection(nodes);
  }

  get isEmpty() {
    return this.blocks.length === 0;
  }

  get isActive() {
    return this.blocks.length > 0;
  }

  constructor(nodes: Node[]) {
    this.blocks = sortNodes(nodes, "index");
  }

  sorted() {}
}
