import { Node } from "@emrgen/carbon-core";
import { R2Tree } from "./R2Tree";
import { BBox } from '@emrgen/types';

const nodeRemover = (a, b) => {
	return a.data.id.eq(b.data.id)
}

export class NodeR2Tree {
	rtree: R2Tree<Node>;

	constructor() {
		this.rtree = new R2Tree(nodeRemover);
	}

	addDroppable(node, bound) {
		this.rtree.put({ ...bound, data: node });
	}

	removeDroppable(node: Node) {
		this.rtree.remove({ data: node });
	}

	search(box: BBox) {
		return this.rtree.search(box);
	}

}
