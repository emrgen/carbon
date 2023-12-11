import { Optional } from "@emrgen/types";
import { NodeBTree } from "./BTree";
import { Node } from "./Node";
import { NodeId } from "./NodeId";

export class NodeMap {
  private _map: NodeBTree = new NodeBTree();
  private _parent: NodeMap | null = null;

  constructor(parent?: NodeMap) {
    this._parent = parent || null;
  }

  get(key: string) {
    return this._map.get(key) || this._parent?.get(key);
  }

  set(key: string, value: any) {
    this._map.set(key, value);
  }

  has(key: string) {
    return this._map.has(key) || this._parent?.has(key);
  }

  delete(key: string) {
    this._map.delete(key);
  }

  parent(from: NodeId | Node): Optional<Node> {
    let node = from instanceof Node ? from : this.get(from.id)
    return node && node.parentId && this.get(node.parentId);
  }

  freeze() {
    this._map.freeze();
    Object.freeze(this);
  }
}
