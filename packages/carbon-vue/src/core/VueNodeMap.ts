import {Node, NodeBTree, NodeId, NodeMap} from "@emrgen/carbon-core";
import {Optional} from "@emrgen/types";

export class VueNodeMap implements NodeMap {

  static empty() {
    return new VueNodeMap();
  }

  map: NodeBTree = new NodeBTree();

  constructor() {}

  get size() {
    return this.map.size;
  }

  delete(key: NodeId): void {
    this.map.delete(key);
  }

  forEach(fn: (value: Node, key: NodeId) => void): void {
    this.map.forEach(fn)
  }

  get(key: NodeId): Optional<Node> {
    return this.map.get(key);
  }

  set(key: NodeId, value: Node): void {
    this.map.set(key, value);
  }

  has(key: NodeId): boolean {
    return this.map.has(key);
  }

  ids(): NodeId[] {
    return Array.from(this.map.keys());
  }

  nodes(): Node[] {
    return Array.from(this.map.values());
  }


}
