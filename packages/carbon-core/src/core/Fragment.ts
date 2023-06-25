import { Node } from "./Node";
import { each } from 'lodash';
import { NodeId } from "./NodeId";
import { With } from "@emrgen/types";

// a list of nodes
export class Fragment {
	static fromNode(node: Node): Fragment {
		return Fragment.from([node]);
	}

	static from(nodes: Node[]): Fragment {
		return new Fragment(nodes);
	}

	get isEmpty() {
		return this.content.length === 0
	}

	get nodes(): Node[] {
		return this.content
	}

	get ids(): NodeId[] {
		return this.content.map(n => n.id)
	}

	get childCount() {
		return this.nodes.length
	}

	constructor(readonly content: Node[]) {}

	child(index: number) {
		return this.nodes[index]
	}

	insertBefore(node: Node): Fragment {
		return Fragment.from([node, ...this.nodes])
	}

	insertAfter(node: Node): Fragment {
		return Fragment.from([...this.nodes, node])
	}

	destroy(): void {
	}

	// process each node inside the fragment
	forEach(fn: With<Node>) {
		this.nodes.forEach(fn)
	}

	// traverse all nodes inside the fragment
	forAll(fn: With<Node>) {
		this.nodes.forEach(n => n.preorder(ch => {
			fn(ch)
			return false;
		}));
	}
}
