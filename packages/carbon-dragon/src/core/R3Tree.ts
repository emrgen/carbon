import { RBush3D, BBox } from 'rbush-3d';
import { LRUCache } from 'lru-cache'
import { RemoveRtreeEntryFn } from '../types';

export interface R3TreeEntry<T> extends BBox {
  data: T;
}

// finds hits in 3d space
export class R3Tree<T> {

  private tree: RBush3D;

  remover: RemoveRtreeEntryFn | undefined;

  private cache: LRUCache<string, R3TreeEntry<T>[]>;

  constructor(remover: RemoveRtreeEntryFn) {
    this.tree = new RBush3D()
    this.remover = remover;
    this.cache = new LRUCache({
      max: 50,
      maxSize: 100,
      sizeCalculation: (value, key) => {
        return 1
      }
    })
  }

  put(entry: R3TreeEntry<T>) {
    this.cache.clear();
    this.tree.insert(entry);
  }

  remove(entry: any): void {
    this.tree = this.tree.remove(entry, this.remover)
  }

  search(entry: BBox): R3TreeEntry<T>[] {
    const key = this.encodeBBox(entry);
    if (!this.cache.has(key)) {
      const results = this.tree.search(entry) as R3TreeEntry<T>[];
      this.cache.set(key, results);
      return results
    } else {
      return this.cache.get(key) ?? [];
    }
  }

  all() {
    return this.tree.all()
  }

  private encodeBBox(box: BBox) {
    const {minX, minY, maxX, maxY, minZ, maxZ} = box;
    return `${minX},${maxX}-${minY},${maxY}-${minZ}:${maxZ}`;
  }

  clear() {
    this.tree = this.tree.clear();
    this.cache.clear();
  }
}
