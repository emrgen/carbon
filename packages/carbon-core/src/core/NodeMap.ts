import {Optional} from "@emrgen/types";
import {NodeBTree} from "./BTree";
import {Node} from "./Node";
import {NodeId} from "./NodeId";

export interface NodeMap {
  get(key: NodeId): Optional<Node>;
  parent(key: NodeId): Optional<Node>;
  put(node: Node): void;
  set(key: NodeId, value: Node): void;
  has(key: NodeId): boolean;
  delete(key: NodeId): void;
  deleted(id: NodeId): boolean;
  forEach(fn: (value: Node, key: NodeId) => void): void;
  nodes(): Node[];
  ids(): NodeId[];
  size: number;
}

export class BTreeNodeMap implements NodeMap {

  static empty() {
    return new BTreeNodeMap();
  }

  map: NodeBTree = new NodeBTree();
  _deleted: NodeBTree = new NodeBTree();

  constructor() {}

  get size() {
    return this.map.size
  }

  delete(key: NodeId): void {
    const node = this.get(key);
    this.map.delete(key);
    if (node) {
      this._deleted.set(key, node);
    }
  }

  deleted(id: NodeId): boolean {
    return this._deleted.has(id)
  }

  forEach(fn: (value: Node, key: NodeId) => void): void {
    this.map.forEach(fn)
  }

  get(key: NodeId): Optional<Node> {
    return this.map.get(key);
  }

  parent(key: NodeId): Optional<Node> {
    const node = this.get(key);
    if (node?.parentId) {
      return this.get(node.parentId);
    }
  }

  set(key: NodeId, value: Node): void {
    this.map.set(key, value);
  }

  put(node: Node): void {
    this.map.set(node.id, node);
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
