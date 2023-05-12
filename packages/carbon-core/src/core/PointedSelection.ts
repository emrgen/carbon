import { Point } from './Point';
import { NodeId } from './NodeId';
import { Optional } from '@emrgen/types';
import { PinnedSelection } from './PinnedSelection';
import { NodeStore } from './NodeStore';
import { Pin } from './Pin';
import { classString } from './Logger';

export class PointedSelection {
	tail: Point;
	head: Point;

	get isInvalid() {
		return this.head.isDefault || this.tail.isDefault;
	}

	static within(nodeId: NodeId, offset: number = 0) {
		return PointedSelection.fromPoint(Point.toWithin(nodeId, offset))
	}

	static fromPoint(point: Point): PointedSelection {
		return PointedSelection.create(point, point);
	}

	static create(tail: Point, head: Point): PointedSelection {
		return new PointedSelection(tail, head);
	}

	constructor(tail: Point, head: Point) {
		this.tail = tail;
		this.head = head;
	}

	pin(store: NodeStore): Optional<PinnedSelection> {
		const { tail, head } = this;
		// console.log('Selection.pin', head.toString());
		const focus = Pin.fromPoint(head, store);
		const anchor = Pin.fromPoint(tail, store);
		if (!focus || !anchor) {
			console.warn('Selection.pin: invalid selection', this.toString(), head.toString(), store.get(head.nodeId)	);
			return
		}

		return PinnedSelection.create(anchor, focus);
	}

	eq(other: PointedSelection): boolean {
		return this.tail.eq(other.tail) && this.head.eq(other.head);
	}

	unpin() {
		return this
	}

	clone() {
		return PointedSelection.create(this.tail.clone(), this.head.clone());
	}

	toString() {
		return classString(this)({
			tail: this.tail.toString(),
			head: this.head.toString()
		})
	}

	toJSON() {
		const { tail, head } = this;
		return { tail: tail.toString(), head: head.toString() };
	}
}
