import BTree from 'sorted-btree';
import { NodeId, NodeIdComparator } from './NodeId';
import { Node } from './Node';

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
		super(undefined, NodeIdComparator)
	}
}

