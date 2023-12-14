import { Optional, Predicate, With } from "@emrgen/types";
import { NodeBTree } from "./BTree";
import { Node } from "./Node";
import { NodeId } from "./NodeId";

export class NodeMap {
  private _map: NodeBTree = new NodeBTree();
  private _deleted: NodeBTree = new NodeBTree();
  private _parent: NodeMap | null = null;

  static from(map: NodeMap) {
    return new NodeMap(map);
  }

  constructor(parent?: NodeMap) {
    this._parent = parent || null;
  }

  get isEmpty() {
    return this._map.isEmpty;
  }
  get isEmptyDeep() {
    return this._map.isEmpty && (!this._parent || this._parent.isEmptyDeep);
  }

  forEach(fn: (id: NodeId, node: Optional<Node>) => void, deep = false) {
    this._map.forEach((v, k) => {
      fn(k, v);
    });

    if (deep && this._parent) {
      this._parent.forEach(fn, deep);
    }

    this._deleted.forEach((v, k) => {
      fn(k, null);
    });
  }

  get(key: NodeId): Optional<Node> {
    return this._map.get(key) || this._parent?.get(key);
  }

  set(key: NodeId, value: Node) {
    this._map.set(key, value);
  }

  has(key: NodeId) {
    return this._map.has(key);
  }

  hasDeep(key: NodeId) {
    return this._map.has(key) || this._parent?.hasDeep(key);
  }

  deleted(id: NodeId) {
    return this._deleted.has(id);
  }

  delete(key: NodeId) {
    this._deleted.set(key, this._map.get(key)!);
    this._map.delete(key);
  }

  parent(from: NodeId | Node): Optional<Node> {
    let node = from instanceof Node ? from : this.get(from);
    return node && node.parentId && this.get(node.parentId);
  }

  closest(from: NodeId, fn: Predicate<Node>): Optional<Node> {
    let node = this.get(from);
    while (node) {
      if (fn(node)) return node;
      node = this.parent(node)
    }
  }

  chain(from: NodeId | Node): Node[] {
    let node = from instanceof Node ? from : this.get(from);
    const nodes: Node[] = [];
    while (node) {
      nodes.push(node)
      node = this.parent(node.id);
    }

    return nodes;
  }

  parents(from: NodeId | Node): Node[] {
    let node = from instanceof Node ? from : this.get(from);
    let ret: Node[] = [];
    while (node) {
      node = this.parent(node)!;
      if (node) {
        ret.push(node);
      }
    }
    return ret;
  }

  freeze() {
    this._map.freeze();
    Object.freeze(this);
  }
}
