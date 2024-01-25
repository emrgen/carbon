import {Optional} from "@emrgen/types";
import {NodeBTree} from "./BTree";
import {Node} from "./Node";
import {NodeId, NodeIdComparator} from "./NodeId";
import {Point} from "@emrgen/carbon-core";

export interface NodeMap {
  get(key: NodeId): Optional<Node>;

  parent(key: NodeId): Optional<Node>;

  children(key: NodeId): NodeId[];

  insert(at: Point, childId: NodeId): void;
  // remove child id from parent
  remove(childId: NodeId): void;

  put(node: Node): void;

  set(key: NodeId, value: Node): void;

  has(key: NodeId): boolean;

  delete(key: NodeId): void;

  isDeleted(id: NodeId): boolean;

  forEach(fn: (value: Node, key: NodeId) => void): void;

  nodes(): Node[];

  ids(): NodeId[];

  size: number;
}

export class BTreeNodeMap implements NodeMap {

  static empty() {
    return new BTreeNodeMap();
  }

  _children: Map<NodeId, NodeId[]> = new Map();
  _parents: Map<NodeId, NodeId> = new Map();
  _map: NodeBTree = new NodeBTree();
  _deleted: NodeBTree = new NodeBTree();

  constructor() {}

  get size() {
    return this._map.size
  }

  children(key: NodeId): NodeId[] {
    const children = this._children.get(key);
    return children?.filter(id => !this.isDeleted(id)) ?? [];
  }

  insert(at: Point, childId: NodeId): void {
    switch (at.at) {
      case 'start':
        this.insertAtStart(at.nodeId, childId);
        break;
      case 'end':
        this.insertAtEnd(at.nodeId, childId);
        break;
      case 'before':
        this.insertBefore(at.nodeId, childId);
        break;
      case 'after':
        this.insertAfter(at.nodeId, childId);
        break;
    }
  }

  remove(childId: NodeId) {
    const parentId = this._parents.get(childId);
    if (parentId) {
      const children = this._children.get(parentId);
      if (children) {
        const index = children.findIndex(id => NodeIdComparator(id, childId) === 0);
        if (index >= 0) {
          children.splice(index, 1);
        }
      }
    }
  }

  private insertAfter(prevId: NodeId, childId: NodeId) {
    const parentId = this._parents.get(prevId)!;
    const children = this._children.get(parentId) ?? [];
    const index = children.findIndex(id => NodeIdComparator(id, prevId) === 0);
    if (index >= 0) {
      children.splice(index + 1, 0, childId);
    }
    this._children.set(parentId, children);
    this._parents.set(childId, parentId);
  }

  private insertBefore(nextId: NodeId, childId: NodeId) {
    const parentId = this._parents.get(nextId)!;
    const children = this._children.get(parentId) ?? [];
    const index = children.findIndex(id => NodeIdComparator(id, nextId) === 0);
    if (index >= 0) {
      children.splice(index, 0, childId);
    }
    this._children.set(parentId, children);
    this._parents.set(childId, parentId);
  }

  private insertAtStart(parentId: NodeId, childId: NodeId) {
    const children = this._children.get(parentId) ?? [];
    children.unshift(childId);
    this._children.set(parentId, children);
    this._parents.set(childId, parentId);
  }

  private insertAtEnd(parentId: NodeId, childId: NodeId) {
    const children = this._children.get(parentId) ?? [];
    children.push(childId);
    this._children.set(parentId, children);
    this._parents.set(childId, parentId);
  }

  delete(key: NodeId): void {
    const node = this.get(key);
    this._map.delete(key);
    if (node) {
      this._deleted.set(key, node);
    }
  }

  isDeleted(id: NodeId): boolean {
    return this._deleted.has(id)
  }

  forEach(fn: (value: Node, key: NodeId) => void): void {
    this._map.forEach(fn)
  }

  get(key: NodeId): Optional<Node> {
    return this._map.get(key);
  }

  parent(key: NodeId): Optional<Node> {
    const node = this.get(key);
    if (node?.parentId) {
      return this.get(node.parentId);
    }
  }

  set(key: NodeId, value: Node): void {
    this._map.set(key, value);
  }

  put(node: Node): void {
    this._map.set(node.id, node);
  }

  has(key: NodeId): boolean {
    return this._map.has(key);
  }

  ids(): NodeId[] {
    return Array.from(this._map.keys());
  }

  nodes(): Node[] {
    return Array.from(this._map.values());
  }
}
