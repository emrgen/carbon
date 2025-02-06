import { NodeIdMap } from "./BTree";
import { IndexMap, IndexMapper } from "./IndexMap";
import { NodeId } from "./NodeId";

export class IndexTree {
  root: IndexTreeLeaf | IndexTreeBranch;
  mapper: IndexMapper;
  nodes: NodeIdMap<IndexMap>;

  static create() {
    return new IndexTree();
  }

  constructor(degree: number = 32) {
    this.root = new IndexTreeLeaf(degree);
    this.mapper = IndexMapper.empty();
    this.nodes = NodeIdMap.create();
  }

  indexOf(nodeId: NodeId): number {
    const ref = this.nodes.get(nodeId);
    if (ref) {
      return this.mapper.map(ref, ref.offset);
    }

    return -1;
  }

  insert(nodeId: NodeId, index: number) {}

  insert_range(nodeIds: NodeId[], index: number) {}

  remove(nodeId: NodeId) {}

  remove_range(nodeIds: NodeId[]) {}
}

export class IndexTreeLeaf {
  count: number = 0;
  values: IndexMap[] = [];

  constructor(public degree: number) {
    this.values = new Array(degree);
  }
}

export class IndexTreeBranch {
  count: number = 0;
  children: number[] = [];

  constructor(public degree: number) {
    this.children = new Array(degree + 1);
  }
}
