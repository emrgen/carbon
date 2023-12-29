import {createContext} from "./context";
import {NodeId, Node} from "@emrgen/carbon-core";
import {NodeStore} from "./store";

export interface NodeChange {
  type: 'add:child' | 'remove' | 'update';
  node: Node;
  // parent must exist if type is add or remove
  parent: Node;
  index: number;
}

export interface NodeChangeManager {
  subscribe(nodeId: NodeId, listener: (change: NodeChange, store: NodeStore) => void): void;
  unsubscribe(nodeId: NodeId, listener: (change: NodeChange, store: NodeStore) => void): void;
  notify(change: NodeChange): void;
}

export const NodeChangeContext = createContext<NodeChangeManager>({
  subscribe: () => undefined,
  unsubscribe: () => undefined,
  notify: () => undefined
});
