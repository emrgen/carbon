import { each } from 'lodash';
import BTree from 'sorted-btree';
import { NodeId, NodeIdComparator } from './NodeId';
import { Carbon } from './Carbon';

// A Btree based set
export class BSet<K> {

	private tree: BTree<K, K>;

	compare?: (a: K, b: K) => number;

	static from<K>(container: K[], comparator) {
		const set = new BSet(comparator);
		container.forEach(c => set.add(c));
		return set;
	}

	constructor(compare?: (a: K, b: K) => number) {
		this.tree = new BTree(undefined, compare)
		this.compare = compare
	}

	get size() {
		return this.tree.size
	}

	// this is within other
	eq(other: BSet<K>) {
		return this.toArray().every(k => other.has(k))
	}

	clear() {
		this.tree.clear()
	}

	add(entry: K) {
		this.tree.set(entry, entry);
		return this
	}

	// returns this - other
	sub(other: BSet<K>): BSet<K> {
		const result = new BSet<K>();
		this.forEach(e => {
			if (!other.has(e)) {
				result.add(e);
			}
		})
		return result;
	}


	extend(...sets: BSet<K>[]) {
		each(sets, set => {
			set.forEach(e => this.add(e));
		});
	}

	remove(entry: K): boolean {
		return this.tree.delete(entry);
	}

	deleteKeys(entries: K[]): number {
		return this.tree.deleteKeys(entries)
	}

	entries(firstKey?: K | undefined) {
		return this.tree.keys(firstKey)
	}

	has(entry: K): boolean {
		return this.tree.has(entry)
	}

	map(fn) {
		return this.toArray().map(fn)
	}

	forEach(callback: (entry: K, set: BSet<K>) => void) {
		this.tree.forEach((v) => callback(v, this))
	}

	toArray(): K[] {
		return this.tree.keysArray()
	}

	clone() {
		const ret = new BSet(this.compare);
		this.forEach(e => ret.add(e))
		return ret
	}

}

// Set of deleted Item IDs
export class DeleteSet extends BSet<NodeId> {
	app: Carbon;

	constructor(app: Carbon) {
		super(NodeIdComparator)
		this.app = app;
	}

	shrink(): DeleteSet {
		const { app } = this
		const set = new DeleteSet(app);
		this.toArray()
			.map(id => app.store.get(id))
			.forEach(n => {
				if (n?.parent && set.has(n.parent.id)) {
					set.remove(n.id)
				}
			});

		return set
	}

}

export class NodeIdSet extends BSet<NodeId> {
	constructor() {
		super(NodeIdComparator)
	}
}
