import { Optional } from "@emrgen/types";
import { NodeBTree } from "./BTree";
import { Node } from "./Node";
import { NodeId } from "./NodeId";

export class NodeMap {
  private _map: NodeBTree = new NodeBTree();
  private _parent: NodeMap | null = null;

  static from(map: NodeMap) {
    return new NodeMap(map);
  }

  constructor(parent?: NodeMap) {
    this._parent = parent || null;
  }

  forEach(fn: (id: NodeId, node: Optional<Node>) => void, deep = false) {
    this._map.forEach((k, v) => {
      fn(k, v);
    });
    
    if (deep && this._parent) {
      this._parent.forEach(fn, deep);
    }
  }

  get(key: NodeId) {
    return this._map.get(key) || this._parent?.get(key);
  }

  set(key: NodeId, value: any) {
    this._map.set(key, value);
  }

  has(key: NodeId) {
    return this._map.has(key);
  }

  hasDeep(key: NodeId) {
    return this._map.has(key) || this._parent?.hasDeep(key);
  }

  delete(key: NodeId) {
    this._map.delete(key);
  }

  parent(from: NodeId | Node): Optional<Node> {
    let node = from instanceof Node ? from : this.get(from);
    return node && node.parentId && this.get(node.parentId);
  }

  freeze() {
    this._map.freeze();
    Object.freeze(this);
  }
}
