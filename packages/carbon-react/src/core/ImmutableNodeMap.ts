import {Node, NodeId, NodeMap as NodeMap, NodeBTree} from "@emrgen/carbon-core";
import {Optional, Predicate} from "@emrgen/types";

export class ImmutableNodeMap implements NodeMap {
  private _map: NodeBTree = new NodeBTree();
  private _deleted: NodeBTree = new NodeBTree();
  private _parent: ImmutableNodeMap | null = null;
  private _frozen = false;

  private _size = 0;

  static empty() {
    return new ImmutableNodeMap();
  }

  static from(map: ImmutableNodeMap) {
    return new ImmutableNodeMap(map);
  }

  static fromNodes(nodes: Node[]) {
    const map = new ImmutableNodeMap();
    nodes.forEach(n => map.set(n.id, n));
    return map;
  }

  constructor(parent?: ImmutableNodeMap) {
    if (parent && !parent._frozen) {
      // throw new Error("Parent map must be frozen");
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

  forEach(fn: (node: Node, id: NodeId, ) => void, deep = false) {
    const map = ImmutableNodeMap.empty();
    this.collect(this, map);
    map._map.forEach((v, k) => {
      fn(v, k);
    });
  }

  private collect(map: ImmutableNodeMap, collector: ImmutableNodeMap) {
    if (map._parent) {
      this.collect(map._parent, collector);
    }

    map._map.forEach((v, k) => {
      collector.set(k, v);
    });
  }

  nodes(): Node[] {
    const map = ImmutableNodeMap.empty();
    this.collect(this, map);
    return Array.from(map._map.values());
  }

  ids(): NodeId[] {
    const map = ImmutableNodeMap.empty();
    this.collect(this, map);
    return Array.from(map._map.keys());
  }

  // tries to find the node in the map or in the parent map
  get(key: NodeId): Optional<Node> {
    return this._map.get(key) || this._deleted.get(key) || this._parent?.get(key);
  }

  set(key: NodeId, value: Node) {
    // console.log('setting node map entry', key.toString())
    // once deleted we can't set it back within the same map
    this._deleted.delete(key);
    this._map.set(key, value);
  }

  put(node: Node) {
    this._deleted.delete(node.id);
    this._map.set(node.id, node);
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
    // console.log("deleting", key.toString(), this.get(key));
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

  contracts(depth = 2) {
    if (depth == 0) {
      this._parent?.forEach((v, k) => {
        if (!this._map.has(k)) {
          this._map.set(k, v);
        }
      });
      this._parent = null;
    } else {
      this._parent?.contracts(depth - 1);
    }
  }

  freeze() {
    // if (this._frozen) return;
    // this._frozen = true;
    // this._map.freeze();
    // this._size = this._map.size + (this._parent?.size || 0);
    // Object.freeze(this);
  }
}
