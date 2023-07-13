import { BBox as R2BBox } from "@emrgen/types";
import { sortBy } from "lodash";
import { R3Tree } from './R3Tree';
import { Node } from "@emrgen/carbon-core";

const nodeRemover = (a, b) => {
	return a.data.eq(b.data)
}

export class NodeR3Tree {
	rtree: R3Tree<Node>;

	constructor() {
		this.rtree = new R3Tree(nodeRemover);
	}

	forEach(cb){
		this.rtree.all().forEach(cb)
	}

	// add node with depth as z value
	add(node: Node, bound: R2BBox) {
		this.remove(node);
		// console.log(node)
		const depth = node.depth
		this.rtree.put({
			...bound,
			minZ: depth,
			maxZ: depth,
			data: node
		});
	}

	remove(node: Node) {
		this.rtree.remove({ data: node });
	}

	searchNodes(box: R2BBox): Node[] {
		return sortBy(this.search(box).map(r => r.data), e => -e.depth)
	}

	// should search with
	search(box: R2BBox) {
		const ans = this.rtree.search({ ...box, minZ: -1000, maxZ: 1000 });
		return ans
	}

	all() {
		return this.rtree.all()
	}

	clear() {
		this.rtree.clear()
	}

}
