import { NodeIdSet } from "./BSet";
import { Node } from "./Node";
import { NodeStore } from "./NodeStore";

export class NodeSelection {
  store: NodeStore
  nodeIds: NodeIdSet;

  get nodes() {
    return this.nodeIds.map(id => this.store.get(id)) as Node[];
  }

  get isEmpty() {
    return this.nodeIds.size === 0;
  }

  constructor(store: NodeStore, nodeIds: NodeIdSet,) {
    this.nodeIds = nodeIds;
    this.store = store;
  }

}
