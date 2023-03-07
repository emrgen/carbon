import { Optional } from "@emrgen/types";
import BTree from "sorted-btree";
import { NodeBTree } from './BTree';
import { NodeId } from './NodeId';
import { Node } from '../core/Node';

export class NodeStore {
	private deletedNodeMap: BTree<NodeId, Node> = new NodeBTree();
	private nodeMap: BTree<NodeId, Node> = new NodeBTree();
	private elementMap: BTree<NodeId, HTMLElement> = new NodeBTree();
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

	get(entry: NodeId | HTMLElement): Optional<Node> {
		const nodeId = (entry as NodeId)
		if (nodeId) {
			return this.nodeMap.get(nodeId) ?? this.deletedNodeMap.get(nodeId);
		} else {
			return this.elementToNodeMap.get(entry as HTMLElement);
		}
	}

	put(node: Node) {
		// console.log('put node', node.id.toString(), node.childrenVersion)
		this.deletedNodeMap.delete(node.id);
		this.nodeMap.delete(node.id);
		this.nodeMap.set(node.id, node);
	}

	element(nodeId: NodeId): Optional<HTMLElement> {
		return this.elementMap.get(nodeId)
	}

	// connect the node to the rendered HTML element
	register(node: Node, el: HTMLElement) {
		if (!el) {
			console.error(`Registering empty dom node for ${node.id.toString()}`)
			return
		}
		const { id} = node
		// remove old reference first
		// other part of the id will eventually be added while rendering
		this.delete(node)
		this.nodeMap.set(id, node);
		this.elementMap.set(id, el);
		this.elementToNodeMap.set(el, node);
	}

	delete(node: Node) {
		const { id } = node
		const el = this.elementMap.get(id);
		if (el) {
			this.elementToNodeMap.delete(el)
		}

		this.nodeMap.delete(id)
		this.elementMap.delete(id)
		this.deletedNodeMap.set(id, node);
	}

	deleted(nodeId: NodeId): Optional<Node> {
		return this.deletedNodeMap.get(nodeId);
	}

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
