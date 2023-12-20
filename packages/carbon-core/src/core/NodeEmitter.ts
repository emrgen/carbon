import { each } from 'lodash';
import BTree from "sorted-btree";
import { NodeBTree } from './BTree';
import { Node } from "./Node";
import { NodeId, NodeIdComparator } from './NodeId';
import { NodeWatcher } from "./types";
import { EventEmitter } from 'events';
import { Optional } from "@emrgen/types";

// handles events by executing registered callbacks
export class NodeTopicEmitter<E = string> extends EventEmitter {

	private subscribers: Map<E, BTree<NodeId, Set<NodeWatcher>>> = new Map();

	private publish(event: E, node: Node, ...args: any[]) {
		// console.log('publish', event, node.id,node.version, node.textContent);

		const listeners = this.subscribers.get(event)?.get(node.id);
		// console.log(listeners);
		listeners?.forEach(cb => cb(node, ...args));
	}

	private subscribe(event: E, id: NodeId, cb: NodeWatcher) {
		if (!this.subscribers.has(event)) {
			this.subscribers.set(event, new BTree(undefined, NodeIdComparator));
		}
		const listeners = this.subscribers.get(event)?.get(id) ?? new Set();
		listeners.add(cb)
		this.subscribers.get(event)?.set(id, listeners);
	}

	private unsubscribe(event: E, id: NodeId, cb: NodeWatcher) {
		this.subscribers.get(event)?.get(id)?.delete(cb);
	}

	// three types of events
	// 1. event on a node - any topic
	// 2. event on a node - specific topic
	// 3. event on a topic - any message
	on(event: NodeId, listener: (...args) => void): this
	on(event: E | string | symbol, node: NodeId, listener: (...args) => void): this
	on(event: E | string | symbol, listener: (...args) => void): this
	on(event: E | string | symbol | NodeId, node: NodeId | ((...args) => void), listener?: (...args) => void): this {
		// case 1
		if (event instanceof NodeId && listener) {
			this.subscribe(event.toString() as E, event, listener);
		}

		// case 2
		if (node instanceof NodeId && listener) {
			this.subscribe(event as E, node, listener)
		}

		// case 3
		if (typeof node === 'function') {
			return super.on(event as string, node);
		}

		return this;
	}

	off(event: NodeId, listener: (...args) => void): this
	off(event: E | string | symbol, node: NodeId, listener: (...args) => void): this
	off(event: E | string | symbol, listener: (...args) => void): this
	off(event: E | string | symbol | NodeId, node: NodeId | ((...args) => void), listener?: (...args) => void): this {
		// case 1
		if (event instanceof NodeId) {
			return super.off(event.id.toString(), node as (...args) => void);
		}

		// case 2
		if (node instanceof NodeId && listener) {
			this.unsubscribe(event as E, node, listener)
		}

		if (typeof node === 'function') {
			return super.off(event as string, node);
		}

		return this;
	}

	emit(event: Node, ...args: any[]): boolean
	emit(event: string | symbol, node: Node, ...args: any[]): boolean
	emit(event: string | symbol, ...args: any[]): boolean

	emit(event: E | string | symbol | Node, node: Node | any, ...args: any[]): boolean {
		// case 1
		if (event instanceof Node) {
			this.publish(event.id.toString() as E, node, ...args);
		}

		if (node instanceof Node) {
			console.log('emit', event, node.id.toString(), node.textContent);
			this.publish(event as E, node, ...args);
		}

		super.emit(event as string, ...args)

		return true;
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
			// console.log(node.name, node.id.toString(), listeners, Array.from(this.subscribers.keys()).map(n => n.toString()))
			// each(listeners, cb => cb(node));
		}
	}
}
