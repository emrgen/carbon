import { each } from 'lodash';
import BTree from "sorted-btree";
import { NodeBTree } from './BTree';
import { Node } from "./Node";
import { NodeId, NodeIdComparator } from './NodeId';
import { NodeWatcher } from "./types";

//
export class NodeTopicEmitter<T> {

	private subscribers: Map<T, BTree<NodeId, Set<NodeWatcher>>> = new Map();

	publish(event: T, node: Node) {
		const listeners = this.subscribers.get(event)?.get(node.id)
		// console.log(event, node.id.toString(), this.subscribers.get(event)?.get(node.id));
		// if (!listeners) {
		// 	console.log(event, node.id.toString(), this.subscribers.get(event)?.get(node.id));
		// }
		listeners?.forEach(cb => cb(node));
	}

	subscribe(id: NodeId, event: T, cb: NodeWatcher) {
		if (!this.subscribers.has(event)) {
			this.subscribers.set(event, new NodeBTree())
		}
		const listeners = this.subscribers.get(event)?.get(id) ?? new Set();
		listeners.add(cb)
		this.subscribers.get(event)?.set(id, listeners);
	}

	unsubscribe(id: NodeId, event: T, cb: NodeWatcher) {
		this.subscribers.get(event)?.get(id)?.delete(cb);
	}
}

// pub-sub for any node by id
export class NodeEmitter {

	subscribers: BTree<NodeId, NodeWatcher[]> = new BTree(undefined, NodeIdComparator);

	subscribe(id: NodeId, cb: NodeWatcher) {
		const listeners = this.subscribers.get(id) ?? [];
		listeners.push(cb);
		this.subscribers.set(id, listeners);
		return () => {
			this.unsubscribe(id, cb)
		}
	}

	unsubscribe(id: NodeId, cb: NodeWatcher) {
		const listeners = this.subscribers.get(id) ?? [];
		this.subscribers.set(id, listeners.filter(w => w !== cb));
	}

	publish(node: Node) {
		if (node) {
			const listeners = this.subscribers.get(node.id) ?? [];
			console.log(node.name, node.id.toString(), listeners, Array.from(this.subscribers.keys()).map(n => n.toString()))
			each(listeners, cb => cb(node));
		}
	}
}
