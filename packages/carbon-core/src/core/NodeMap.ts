import { Optional, Predicate, With } from "@emrgen/types";
import BTree from "sorted-btree";
import { NodeBTree } from "./BTree";
import { Node } from "./Node";
import { NodeId, NodeIdComparator } from "./NodeId";

class NodeChainCache {
  private _map: Map<string, number> = new Map();
  private _parents: Map<string, Node[]> = new Map();
  private _chain: Map<string, Node[]> = new Map();

  constructor() {
    // setTimeout(() => {
    //   this._map = new BTree(undefined, NodeIdComparator);
    //   this._parents = new BTree(undefined, NodeIdComparator);
    // },5000)
  }

  index(nodeId: NodeId, root: Node, fn: (nodeId: NodeId) => number) {
    const key = nodeId.toString();
    if (this._map.has(key)) {
      return this._map.get(key);
    } else {
      const index = fn(nodeId);
      this._map.set(key, index);
      return index;
    }
  }

  parents(nodeId: NodeId, root: Node, fn: (node: NodeId) => Node[]): Node[] {
    const key = `${root.scope.toString()}/${root.contentVersion}/${nodeId.toString()}`;
    if (this._parents.has(key)) {
      console.debug('parents cache hit', key);
      return this._parents.get(key) ?? [];
    } else {
      const parents = fn(nodeId);
      this._parents.set(key, parents);
      return parents;
    }
  }

  chain(nodeId: NodeId, root: Node, fn: (node: NodeId) => Node[]): Node[] {
    const key = `${root.scope.toString()}/${root.contentVersion}/${nodeId.toString()}`;
    if (this._chain.has(key)) {
      // console.debug('chain cache hit', key);
      return this._chain.get(key) ?? [];
    } else {
      const chain = fn(nodeId);
      this._chain.set(key, chain);
      return chain;
    }
  }
}

const NODE_CHAIN_CACHE = new NodeChainCache();

export class NodeMap {
  private _map: NodeBTree = new NodeBTree();
  private _deleted: NodeBTree = new NodeBTree();
  private readonly _parent: NodeMap | null = null;
  private _frozen = false;

  private _size = 0;

  static empty() {
    return new NodeMap();
  }

  static from(map: NodeMap) {
    return new NodeMap(map);
  }

  static fromNodes(nodes: Node[]) {
    const map = new NodeMap();
    nodes.forEach(n => map.set(n.id, n));
    return map;
  }

  constructor(parent?: NodeMap) {
    if (parent && !parent._frozen) {
      throw new Error("Parent map must be frozen");
    }

    this._parent = parent || null;
  }

  get size() {
    if (this._frozen) {
      return this._size;
    }
    return this._map.size + (this._parent?.size || 0);
  }

  get current() {
    return this._map;
  }

  forEachDeleted(fn: (id: NodeId, node: Node) => void) {
    this._deleted.forEach((v, k) => {
      fn(k, v);
    });
  }

  forEach(fn: (id: NodeId, node: Node) => void, deep = false) {
    const map = NodeMap.empty();
    this.collect(this, map);
    map._map.forEach((v, k) => {
      fn(k, v);
    });
  }

  private collect(map: NodeMap, collector: NodeMap) {
    if (map._parent) {
      this.collect(map._parent, collector);
    }

    map._map.forEach((v, k) => {
      collector.set(k, v);
    });
  }

  values(): Node[] {
    const map = NodeMap.empty();
    this.collect(this, map);
    return Array.from(map._map.values());
  }

  ids(): NodeId[] {
    const map = NodeMap.empty();
    this.collect(this, map);
    return Array.from(map._map.keys());
  }

  // tries to find the node in the map or in the parent map
  get(key: NodeId): Optional<Node> {
    return this._map.get(key) || this._parent?.get(key);
  }

  set(key: NodeId, value: Node) {
    // console.log('setting node map entry', key.toString())
    // once deleted we can't set it back within the same map
    this._deleted.delete(key);
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
    console.log("deleting", key.toString(), this.get(key));
    this._deleted.set(key, this.get(key)!);
    this._map.delete(key);
  }

  indexOf(node: Node) {
    const parent = this.parent(node);
    const root = this.get(NodeId.ROOT);
    if (!root) {
      throw new Error("carbon root node must always exists. root node not found");
    }

    if (!parent) return -1;
    return parent.children.indexOf(node);
  }

  parent(from: Node|NodeId): Optional<Node> {
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
    if (this._frozen) return;
    this._frozen = true;
    this._map.freeze();
    this._size = this._map.size + (this._parent?.size || 0);
    Object.freeze(this);
  }
}
