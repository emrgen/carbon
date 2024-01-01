import {createContext} from "./context";
import {NodeId, Node} from "@emrgen/carbon-core";
import {RenderStore} from "./RenderContext";

export interface NodeChange {
  type: 'add:child' | 'remove' | 'update' | 'add:text' | 'remove:text';
  node: Node;
  // parent must exist if type is add or remove
  parent?: Node;
  text?: string;
  offset?: number;
}

export interface NodeChangeManager {
  once(nodeId: NodeId, listener: (change: NodeChange) => void): void;
  subscribe(nodeId: NodeId, listener: (change: NodeChange) => void): void;
  unsubscribe(nodeId: NodeId, listener: (change: NodeChange) => void): void;
  unsubscribeAll(nodeId: NodeId): void;
  notify(id: NodeId, change: NodeChange): void;
}

export const NodeChangeContext = createContext<NodeChangeManager>({
  once: () => {
    throw new Error('not implemented');
  },
  subscribe: () => {
    throw new Error('not implemented');
  },
  unsubscribe: () => {
    throw new Error('not implemented');
  },
  unsubscribeAll: () => {
    throw new Error('not implemented');
  },
  notify: (id: NodeId, change: NodeChange) => {
    throw new Error('not implemented');
  }
});
