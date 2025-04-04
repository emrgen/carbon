import { EventEmitter } from "events";
import { each } from "lodash";
import BTree from "sorted-btree";
import { Node } from "./Node";
import { NodeId, NodeIdComparator } from "./NodeId";
import { NodeIdWatcher, NodeWatcher } from "./types";

const nodeIdType = (n: any) => n instanceof NodeId || n instanceof Node;

export class PluginBus {
  bus: EventEmitter = new EventEmitter();
  nodes: NodeTopicEmitter = new NodeTopicEmitter();

  on(event: string, listener: (...args: any) => void) {
    this.bus.on(event, listener);
  }

  off(event: string, listener: (...args: any) => void) {
    this.bus.off(event, listener);
  }

  emit(event: string, ...args: any[]) {
    this.bus.emit(event, ...args);
  }
}

// handles events by executing registered callbacks
export class NodeTopicEmitter {
  private listeners: Map<string | symbol, BTree<NodeId, Set<NodeWatcher>>> =
    new Map();

  on(id: NodeId, event: string | symbol, cb: NodeWatcher) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new BTree(undefined, NodeIdComparator));
    }
    const listeners = this.listeners.get(event)?.get(id) ?? new Set();
    listeners.add(cb);

    this.listeners.get(event)?.set(id, listeners);
  }

  off(id: NodeId, event: string | symbol, cb: NodeWatcher) {
    this.listeners.get(event)?.get(id)?.delete(cb);
  }

  // unsubscribe from all events
  offAll(id: NodeId) {
    this.listeners.forEach((events, event) => {
      events.get(id)?.clear();
    });
  }

  emit(node: Node, event: string | symbol, ...args: any[]) {
    const listeners = this.listeners.get(event)?.get(node.id);
    listeners?.forEach((cb) => {
      // console.log('emitting', event, node.id, cb);
      cb(node, ...args);
    });

    // emit wildcard event
    if (event !== "*") {
      this.emit(node, "*", ...args);
    }
  }
}

export class NodeIdTopicEmitter {
  private listeners: Map<string | symbol, BTree<NodeId, Set<NodeIdWatcher>>> =
    new Map();

  on(nodeId: NodeId, event: string | symbol, cb: NodeIdWatcher) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new BTree(undefined, NodeIdComparator));
    }
    const listeners = this.listeners.get(event)?.get(nodeId) ?? new Set();
    listeners.add(cb);

    this.listeners.get(event)?.set(nodeId, listeners);
  }

  off(nodeId: NodeId, event: string | symbol, cb: NodeIdWatcher) {
    this.listeners.get(event)?.get(nodeId)?.delete(cb);
  }

  // unsubscribe from all events
  offAll(nodeId: NodeId) {
    this.listeners.forEach((events, event) => {
      events.get(nodeId)?.clear();
    });
  }

  emit(nodeId: NodeId, event: string | symbol, ...args: any[]) {
    const listeners = this.listeners.get(event)?.get(nodeId);
    listeners?.forEach((cb) => {
      cb(nodeId, ...args);
    });

    // emit wildcard event
    if (event !== "*") {
      this.emit(nodeId, "*", ...args);
    }
  }
}

// pub-sub for any node by id
// publish will notify all subscribers of the node
export class NodeEmitter {
  subscribers: BTree<NodeId, NodeWatcher[]> = new BTree(
    undefined,
    NodeIdComparator,
  );

  // subscribe to node by id
  on(id: NodeId, cb: NodeWatcher) {
    const listeners = this.subscribers.get(id) ?? [];
    listeners.push(cb);
    this.subscribers.set(id, listeners);
    return () => {
      this.off(id, cb);
    };
  }

  // unsubscribe from node by id
  off(id: NodeId, cb: NodeWatcher) {
    const listeners = this.subscribers.get(id) ?? [];
    this.subscribers.set(
      id,
      listeners.filter((w) => w !== cb),
    );
  }

  // publish updated node to all subscribers
  emit(node: Node) {
    if (node) {
      const listeners = this.subscribers.get(node.id) ?? [];
      each(listeners, (cb) => cb(node));
    }
  }
}
