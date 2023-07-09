import { each } from 'lodash';
import BTree from "sorted-btree";
import { NodeBTree } from './BTree';
import { Node } from "./Node";
import { NodeId, NodeIdComparator } from './NodeId';
import { NodeWatcher } from "./types";
import { EventEmitter } from 'events';

// handles events by executing registered callbacks
export class NodeTopicEmitter<E> extends EventEmitter {

	private subscribers: Map<E, BTree<NodeId, Set<NodeWatcher>>> = new Map();

	publish(event: E, node: Node) {
		// console.log('publish', event, node.id,node.version, node.textContent);

		const listeners = this.subscribers.get(event)?.get(node.id);
		// console.log(listeners);
		listeners?.forEach(cb => cb(node));
	}

	subscribe(id: NodeId, event: E, cb: NodeWatcher) {
		if (!this.subscribers.has(event)) {
			this.subscribers.set(event, new NodeBTree())
		}
		const listeners = this.subscribers.get(event)?.get(id) ?? new Set();
		listeners.add(cb)
		this.subscribers.get(event)?.set(id, listeners);
	}

	unsubscribe(id: NodeId, event: E, cb: NodeWatcher) {
		this.subscribers.get(event)?.get(id)?.delete(cb);
	}
}

// pub-sub for any node by id
// publish will notify all subscribers of the node
export class NodeEmitter {

	subscribers: BTree<NodeId, NodeWatcher[]> = new BTree(undefined, NodeIdComparator);

	// subscribe to node by id
	subscribe(id: NodeId, cb: NodeWatcher) {
		const listeners = this.subscribers.get(id) ?? [];
		listeners.push(cb);
		this.subscribers.set(id, listeners);
		return () => {
			this.unsubscribe(id, cb)
		}
	}

	// unsubscribe from node by id
	unsubscribe(id: NodeId, cb: NodeWatcher) {
		const listeners = this.subscribers.get(id) ?? [];
		this.subscribers.set(id, listeners.filter(w => w !== cb));
	}

	// publish updated node to all subscribers
	publish(node: Node) {
		if (node) {
			const listeners = this.subscribers.get(node.id) ?? [];
			console.log(node.name, node.id.toString(), listeners, Array.from(this.subscribers.keys()).map(n => n.toString()))
			each(listeners, cb => cb(node));
		}
	}
}
