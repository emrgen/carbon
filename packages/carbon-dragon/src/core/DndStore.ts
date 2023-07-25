import { Optional, BBox } from "@emrgen/types";
import BTree from "sorted-btree";
import { NodeR3Tree } from './NodeR3Tree';
import { elementBound } from "./utils";
import { Node, NodeId, NodeIdComparator } from "@emrgen/carbon-core";

export class DndNodeStore {
	private nodeMap: BTree<NodeId, Node> = new BTree(undefined, NodeIdComparator);
	private elementMap: BTree<NodeId, HTMLElement> = new BTree(undefined, NodeIdComparator);
	private elementToNodeMap: WeakMap<HTMLElement, Node> = new WeakMap();
	private rtree: NodeR3Tree = new NodeR3Tree();

	get size() {
		return this.rtree.all().length
	}

	collides(box: BBox): Node[] {
		return this.rtree.searchNodes(box);
	}

	refresh(scrollTop: number, scrollLeft: number) {
		this.rtree.clear();
		this.entries().forEach(e => {
			// console.warn('refresh', e.node.id.toString(), e.el, elementBound(e.el!).top);
			this.rtree.add(e.node, elementBound(e.el!, {left: scrollLeft, top: scrollTop}))
		})
	}

	private entries() {
		return this.nodes().map(n => ({ node: n, el: this.element(n.id) }))
	}

	private nodes() {
		return Array.from(this.nodeMap.values())
	}

	private element(id: NodeId): Optional<HTMLElement> {
		return this.elementMap.get(id)
	}

	reset() {
		this.nodeMap.clear();
		this.elementMap.clear();
		this.rtree.clear();
		this.elementToNodeMap = new WeakMap();
	}

	get(entry: NodeId | HTMLElement): Optional<Node> {
		if (entry instanceof NodeId) {
			return this.nodeMap.get(entry);
		} else {
			return this.elementToNodeMap.get(entry as HTMLElement);
		}
	}

	put(node: Node) {
		this.nodeMap.delete(node.id);
		this.nodeMap.set(node.id, node);
	}


	// connect the node to the rendered HTML element
	register(node: Node, el: HTMLElement) {
		if (!el) {
			console.error(`Registering empty dom node for ${node.id.toString()}`)
			return
		}
		const { id } = node
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
		this.rtree.remove(node);
	}

}
