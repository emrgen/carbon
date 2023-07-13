import { BBox } from "@emrgen/types";
import RBush from "rbush";
import { LRUCache } from 'lru-cache';
import { RemoveRtreeEntryFn } from "../types";

export interface RTreeEntry<T> extends BBox {
  data: T;
}

export const defaultRTreeEntryRemover = (a, b) => a === b

// finds hits in 3d space
export class R2Tree<T> {

  private tree: RBush<RTreeEntry<T>>;

  remover: RemoveRtreeEntryFn | undefined;

  private cache: LRUCache<string, RTreeEntry<T>[]>;

  constructor(remover: RemoveRtreeEntryFn) {
    this.tree = new RBush()
    this.remover = remover;
    this.cache = new LRUCache({
      max: 50,
      maxSize: 100,
      sizeCalculation: (value, key) => {
        return 1
      }
    })
  }

  put(entry: RTreeEntry<T>) {
    this.tree.insert(entry);
  }

  remove(entry: any): void {
    this.tree = this.tree.remove(entry, this.remover)
  }

  search(entry: BBox): RTreeEntry<T>[] {
    const key = this.encodeBBox(entry);
    if (!this.cache.has(key)) {
      const results = this.tree.search(entry);
      this.cache.set(key, results);
      return results
    } else {
      return this.cache.get(key) ?? [];
    }
  }

  private encodeBBox(box: BBox) {
    const {minX, minY, maxX, maxY} = box;
    return `${minX},${minY}-${maxX},${maxY}`;
  }

  clear() {
    this.tree = this.tree.clear();
    this.cache.clear();
  }
}
