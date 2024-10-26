import { Node, NodeId } from "@emrgen/carbon-core";
import { BBox as R2BBox } from "@emrgen/types";
import { sortBy } from "lodash";
import { R3Tree } from "./R3Tree";

const nodeRemover = (a, b) => {
  return a.nodeId.eq(b.nodeId);
};

export class NodeR3Tree {
  rtree: R3Tree<Node>;

  constructor() {
    this.rtree = new R3Tree(nodeRemover);
  }

  forEach(cb) {
    this.rtree.all().forEach(cb);
  }

  // add node with depth as z value
  add(node: Node, bound: R2BBox) {
    this.remove(node.id);
    // nodes at lower depth should be at the top
    const depth = node.depth;
    this.rtree.put({
      ...bound,
      minZ: depth,
      maxZ: depth,
      data: node,
      nodeId: node.id,
    });
  }

  remove(nodeId: NodeId) {
    this.rtree.remove({ nodeId });
  }

  searchNodes(box: R2BBox): Node[] {
    return sortBy(
      this.search(box).map((r) => r.data),
      (e) => -e.depth,
    );
  }

  // should search with
  search(box: R2BBox) {
    return this.rtree.search({ ...box, minZ: -1000, maxZ: 1000 });
  }

  all() {
    return this.rtree.all();
  }

  clear() {
    this.rtree.clear();
  }
}
