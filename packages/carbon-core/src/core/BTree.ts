import BTree from "sorted-btree";
import { NodeId, NodeIdComparator } from "./NodeId";
import { Node } from "./Node";

export class NodeBTree extends BTree<NodeId, Node> {
  static from(nodes: Node[]) {
    let tree = new NodeBTree();
    for (let node of nodes) {
      tree.set(node.id, node);
    }
    return tree;
  }

  nodes(): Node[] {
    return Array.from(this.values());
  }

  static create() {
    return new NodeBTree();
  }

  constructor() {
    super(undefined, NodeIdComparator);
  }
}

export class NodeIdMap<T> extends BTree<NodeId, T> {
  static from<T>(map: Map<NodeId, T>) {
    let tree = new NodeIdMap<T>();
    for (let [key, value] of map) {
      tree.set(key, value);
    }
    return tree;
  }

  static create<T>() {
    return new NodeIdMap<T>();
  }

  constructor() {
    super(undefined, NodeIdComparator);
  }
}
