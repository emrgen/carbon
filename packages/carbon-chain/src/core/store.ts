import {Node, NodeId} from "@emrgen/carbon-core";
import {Optional} from "@emrgen/types";
import {createContext, getContext} from "./context";

export interface NodeStore {
  get(id: NodeId | HTMLElement): Optional<Node>;
  element(id: NodeId): Optional<HTMLElement>;
  register(node: Node, el: HTMLElement): void;
  unregister(node: Node): void;
}

export const NodeStoreContext = createContext<NodeStore>({
  get: () => undefined,
  element: () => undefined,
  register: () => undefined,
  unregister: () => undefined
});
