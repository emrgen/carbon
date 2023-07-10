import { NodeIdSet } from "./BSet";
import { Node } from "./Node";
import { NodeStore } from "./NodeStore";

//
export class BlockSelection {
  //
  store: NodeStore
  nodeIds: NodeIdSet;

  static empty(store: NodeStore) {
    return new BlockSelection(store, NodeIdSet.empty);
  }

  get blocks(): Node[] {
    const blocks: any[] = this.nodeIds.map(id => {
      const node = this.store.get(id);
      return {
        node,
        path: (node?.path ?? [])
      }
    });

    // Sort by path
    blocks.sort((a, b) => {
      const aPath = a.path;
      const bPath = b.path;
      for (let i = 0, size = Math.min(aPath.length, bPath.length); i < size; i++) {
        if (aPath[i] < bPath[i]) {
          return -1;
        }

        if (aPath[i] > bPath[i]) {
          return 1;
        }
      }

      if (aPath.length < bPath.length) {
        return -1;
      }

      if (aPath.length > bPath.length) {
        return 1;
      }

      return 0;
    });

    if (blocks.length === 0) {
      console.error('No blocks found in selection', this.nodeIds.map(id => id.toString()));
      return [];
    }

    return blocks.map(n => n.node)
  }

  get isEmpty() {
    return this.nodeIds.size === 0;
  }

  get size() {
    return this.nodeIds.size
  }

  constructor(store: NodeStore, nodeIds: NodeIdSet,) {
    this.nodeIds = nodeIds;
    this.store = store;
  }

}
