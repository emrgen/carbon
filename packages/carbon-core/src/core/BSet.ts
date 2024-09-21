import { each, identity } from "lodash";
import BTree from "sorted-btree";
import { NodeId, NodeIdComparator } from "./NodeId";
import { Carbon } from "./Carbon";
import { Maps } from "./types";
import { NodeMap } from "./NodeMap";
import { Node } from "./Node";
import { classString } from "./Logger";

// A Btree based set
export class BSet<K> {
  protected tree: BTree<K, K>;

  compare?: (a: K, b: K) => number;

  static from<K>(container: K[], comparator) {
    const set = new BSet(comparator);
    container.forEach((c) => set.add(c));
    return set;
  }

  constructor(compare?: (a: K, b: K) => number) {
    this.tree = new BTree(undefined, compare);
    this.compare = compare;
  }

  get size() {
    return this.tree.size;
  }

  // this is within other
  eq(other: BSet<K>) {
    return this.toArray().every((k) => other.has(k));
  }

  clear() {
    this.tree.clear();
  }

  add(entry: K[] | K) {
    const entries = Array.isArray(entry) ? entry : [entry];
    entries.forEach((e) => this.tree.set(e, e));
    return this;
  }

  // returns this - other
  sub(other: BSet<K>): BSet<K> {
    const result = new BSet<K>();
    this.forEach((e) => {
      if (!other.has(e)) {
        result.add(e);
      }
    });
    return result;
  }

  extend(...sets: BSet<K>[]) {
    each(sets, (set) => {
      set.forEach((e) => this.add(e));
    });
  }

  remove(entry: K): boolean {
    return this.tree.delete(entry);
  }

  deleteKeys(entries: K[]): number {
    return this.tree.deleteKeys(entries);
  }

  entries(firstKey?: K | undefined) {
    return this.tree.keys(firstKey);
  }

  has(entry: K): boolean {
    return this.tree.has(entry);
  }

  map<V>(fn: Maps<K, V>) {
    return this.toArray().map(fn);
  }

  forEach(callback: (entry: K, set: BSet<K>) => void) {
    this.tree.forEach((v) => callback(v, this));
  }

  toArray(): K[] {
    return this.tree.keysArray();
  }

  clone() {
    const ret = new BSet(this.compare);
    this.forEach((e) => ret.add(e));
    return ret;
  }

  freeze() {
    // this.add = () => { throw new Error('Cannot add to a frozen set') }
    // this.remove = () => { throw new Error('Cannot remove from a frozen set') }
    // this.deleteKeys = () => { throw new Error('Cannot delete from a frozen set') }
    // this.clear = () => { throw new Error('Cannot clear a frozen set') }
    // this.extend = () => { throw new Error('Cannot extend a frozen set') }

    Object.freeze(this);

    return this;
  }

  toJSON(): any {
    return this.toArray();
  }
}

// Set of deleted Item IDs
export class DeleteSet extends BSet<NodeId> {
  app: Carbon;

  constructor(app: Carbon) {
    super(NodeIdComparator);
    this.app = app;
  }

  shrink(): DeleteSet {
    const { app } = this;
    const set = new DeleteSet(app);
    this.toArray()
      .map((id) => app.store.get(id))
      .forEach((n) => {
        if (n?.parent && set.has(n.parent.id)) {
          set.remove(n.id);
        }
      });

    return set;
  }

  toJSON() {
    return this.toArray().map((id) => id.toString());
  }
}

export class NodeIdSet extends BSet<NodeId> {
  static EMPTY = new NodeIdSet().freeze();

  static empty() {
    return new NodeIdSet();
  }

  static fromIds(ids: NodeId[]) {
    return new NodeIdSet(ids);
  }

  constructor(ids: NodeId[] = []) {
    super(NodeIdComparator);
    this.add(ids);
  }

  diff(other: NodeIdSet): NodeIdSet {
    const result = new NodeIdSet();
    this.sub(other).forEach((e) => result.add(e));
    return result;
  }

  union(other: NodeIdSet): NodeIdSet {
    const result = new NodeIdSet();
    this.forEach((e) => result.add(e));
    other.forEach((e) => result.add(e));
    return result;
  }

  intersect(other: NodeIdSet): NodeIdSet {
    const result = new NodeIdSet();
    this.forEach((e) => {
      if (other.has(e)) {
        result.add(e);
      }
    });
    return result;
  }

  nodes(nodeMap: NodeMap) {
    return (this.toArray()
      .map((id) => nodeMap.get(id))
      .filter(identity) ?? []) as unknown as Node[];
  }

  clone(): NodeIdSet {
    const ret = new NodeIdSet();
    this.forEach((e) => ret.add(e));
    return ret;
  }

  toJSON() {
    return this.toArray().map((id) => id.toString());
  }

  toString() {
    return classString(this)(this.toArray().map((id) => id.toString()));
  }
}
