import {NodeId, NodeIdComparator, NodeWatcher} from "@emrgen/carbon-core";
import {NodeChange, NodeChangeManager} from "./change";
import {RenderStore} from "./RenderContext";
import {NodeTopicEmitter} from "@emrgen/carbon-core/src/core/NodeEmitter";
import BTree from "sorted-btree";

type NodeChangeListeners = Set<(change: NodeChange) => void>;

export class ChainNodeChangeManager implements NodeChangeManager {
  private listeners: BTree<NodeId, NodeChangeListeners> = new BTree(undefined, NodeIdComparator);

  notify(id: NodeId, change: NodeChange): void {
    const listeners = this.listeners.get(id);
    if (listeners) {
      listeners.forEach(listener => listener(change));
    }
  }

  once(nodeId: NodeId, listener: (change: NodeChange) => void): void {
    const wrappedListener = (change: NodeChange) => {
      listener(change);
      this.unsubscribe(nodeId, wrappedListener);
    }

    this.subscribe(nodeId, wrappedListener);
  }

  subscribe(nodeId: NodeId, listener: (change: NodeChange) => void): void {
    if (!this.listeners.has(nodeId)) {
      this.listeners.set(nodeId, new Set());
    }
    this.listeners.get(nodeId)?.add(listener);
  }

  unsubscribe(nodeId: NodeId, listener: (change: NodeChange) => void): void {
    this.listeners.get(nodeId)?.delete(listener);
  }

}
