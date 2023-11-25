import { Optional } from "@emrgen/types";
import { NodeId } from './NodeId';
import { Node } from './Node';

export class NodeStore {
	private deletedNodeMap: Map<string, Node> = new Map();
	private nodeMap: Map<string, Node> = new Map();
	private elementMap: Map<string, HTMLElement> = new Map();
	private elementToNodeMap: WeakMap<HTMLElement, Node> = new WeakMap();

	nodes() {
		return Array.from(this.nodeMap.values());
	}

	elements() {
		return Array.from(this.elementMap.values());
	}

	entries() {
		return this.nodes().map(n => [n, this.element(n.id)]);
	}

	reset() {
		this.deletedNodeMap.clear()
		this.nodeMap.clear()
		this.elementMap.clear()
		this.elementToNodeMap = new WeakMap();
	}

	getById(id: string): Optional<Node> {
		return this.nodeMap.get(id)
	}

	get(entry: NodeId | HTMLElement): Optional<Node> {
		const nodeId = entry;
		if (nodeId instanceof NodeId) {
			return this.nodeMap.get(nodeId.id) //?? this.deletedNodeMap.get(nodeId.id);
		} else {
			return this.elementToNodeMap.get(entry as HTMLElement);
		}
	}

	put(node: Node) {
		if (node.deleted) {
			this.deletedNodeMap.set(node.id.id, node);
			this.nodeMap.delete(node.id.id);
		} else {
			this.deletedNodeMap.delete(node.id.id);
			this.nodeMap.set(node.id.id, node);
		}
		// console.log('put node', node.id.toString());
	}

	update(node: Node) {
		if (node.deleted) {
			this.delete(node);
		} else {
			this.deletedNodeMap.delete(node.id.id);
			this.nodeMap.set(node.id.id, node);
		}
	}

	// get the rendered HTML element for the node
	element(nodeId: NodeId): Optional<HTMLElement> {
		const el = this.elementMap.get(nodeId.id)
		if (el) {
			return el
		}

		// expensive operation but should be called when the node is not in the store yet
		const domEl = document.querySelector(`[data-id="${nodeId.toString()}"]`) as HTMLElement;
		const node = this.get(nodeId);
		if (domEl && node) {
			this.register(node, domEl);
		}

		console.error(`NodeStore.element: element not found for ${nodeId.toString()}`);
		return domEl;
	}

	// connect the node to the rendered HTML element
	register(node: Node, el: Optional<HTMLElement>) {
		if (!el) {
			console.error(`Registering empty dom node for ${node.id.toString()}`)
			return
		}
		const { id: nodeId } = node;
		const { id } = nodeId;
		// remove old reference first
		// other part of the id will eventually be added while rendering
		this.delete(node);
		// console.log('register node', node.id.toString());
		this.deletedNodeMap.delete(id);
		this.nodeMap.set(id, node);
		this.elementMap.set(id, el);
		this.elementToNodeMap.set(el, node);
	}

	delete(node: Node) {
		// console.log('delete node', node.id.toString());
		const { id: nodeId } = node
		const { id } = nodeId
		const el = this.elementMap.get(id);
		if (el) {
			this.elementToNodeMap.delete(el)
		}

		this.nodeMap.delete(id)
		this.elementMap.delete(id)
		this.deletedNodeMap.set(id, node);
	}

	// deleted(nodeId: NodeId): Optional<Node> {
	// 	const { id } = nodeId
	// 	return this.deletedNodeMap.get(id);
	// }

	resolve(el: any): Optional<Node> {
		if (!el) return
		let node: Optional<Node>;

		do {
			node = this.elementToNodeMap.get(el);
			if (node) {
				break
			} else {
				el = el.parentNode;
			}
		} while (el)

		return node;
	}

}
