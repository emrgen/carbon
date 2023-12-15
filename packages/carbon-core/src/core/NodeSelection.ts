import { NodeIdSet } from "./BSet";
import { Node } from "./Node";
import { NodeId } from "./NodeId";
import { NodeMap } from "./NodeMap";

//
export class BlockSelection {
  private readonly map: NodeMap
  private readonly nodeIds: NodeIdSet;

  static empty(map: NodeMap) {
    return new BlockSelection(map, NodeIdSet.empty);
  }

  get blockIds(): NodeId[] {
    return this.nodeIds.toArray()
  }

  get blocks(): Node[] {
    const blocks: any[] = this.nodeIds.map(id => {
      const node = this.map.get(id);
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

  constructor(map: NodeMap, nodeIds: NodeIdSet) {
    this.nodeIds = nodeIds;
    this.map = map;
  }

  has(id: NodeId) {
    return this.nodeIds.has(id);
  }

}
