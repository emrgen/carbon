import BTree from 'sorted-btree';
import { NodeId, NodeIdComparator } from './NodeId';
import { Node } from './Node';

export class NodeBTree extends BTree<NodeId, Node> {
	constructor() {
		super(undefined, NodeIdComparator)
	}
}

