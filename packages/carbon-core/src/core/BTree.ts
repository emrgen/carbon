import BTree from 'sorted-btree';
import { NodeIdComparator } from './NodeId';

export class NodeBTree extends BTree {
	constructor() {
		super(undefined, NodeIdComparator)
	}
}
