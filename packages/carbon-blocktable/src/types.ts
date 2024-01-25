import {Node, NodeId, Point} from "@emrgen/carbon-core";
import {Optional} from "@emrgen/types";

interface BlockTable {
  get(nodeId: NodeId): Optional<Node>;

  insert(at: Point, block: Node): void;
  // mark node as deleted, but keep it in the map
  delete(nodeId: NodeId): void;
  // remove child id from parent, remove the node from the map
  erase(nodeId: NodeId): void;
  isDeleted(nodeId: NodeId): boolean;

  forEach(fn: (node: Node, nodeId: NodeId) => void): void;
  nodes(): Node[];
  ids(): NodeId[];
}
