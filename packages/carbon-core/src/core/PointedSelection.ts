import { Point } from "./Point";
import { NodeId } from "./NodeId";
import { Optional } from "@emrgen/types";
import { PinnedSelection } from "./PinnedSelection";
import { Pin } from "./Pin";
import { classString } from "./Logger";
import { ActionOrigin } from "./actions";
import { NodeMap } from "./NodeMap";
import { Node } from "@emrgen/carbon-core";

export class PointedSelection {
	get isInvalid() {
		return this.head.isDefault || this.tail.isDefault;
	}

	static atStart(nodeId: NodeId, offset: number = 0) {
		return PointedSelection.fromPoint(Point.toStart(nodeId, offset))
	}

	static fromPoint(point: Point): PointedSelection {
		return PointedSelection.create(point, point);
	}

	static fromNodes(nodeIds: NodeId[], origin: ActionOrigin = ActionOrigin.Unknown) {
		return new PointedSelection(Point.IDENTITY, Point.IDENTITY, nodeIds, origin);
	}

	static create(tail: Point, head: Point, origin = ActionOrigin.Unknown): PointedSelection {
		return new PointedSelection(tail, head, [], origin);
	}

	constructor(readonly tail: Point, readonly head: Point, readonly nodeIds: NodeId[], public origin: ActionOrigin = ActionOrigin.Unknown) {
	}

	get isBlock() {
		return this.nodeIds.length > 0;
	}

	get isInline() {
		return this.nodeIds.length === 0
	}

	pin(store: NodeMap): Optional<PinnedSelection> {
		const { tail, head, origin } = this;
		// console.log('Selection.pin', head.toString());

		if (this.isBlock) {
			const nodes = (this.nodeIds.map(id => store.get(id)).filter(n => n) ?? []) as unknown as Node[];
			if (nodes.length !== this.nodeIds.length) {
				throw new Error('Selection.pin: invalid selection');
			}
			return PinnedSelection.fromNodes(nodes, origin)
		}

		const focus = Pin.fromPoint(head, store);
		const anchor = Pin.fromPoint(tail, store);
		if (!focus || !anchor) {
			console.warn('Selection.pin: invalid selection', this.toString(), head.toString(), store.get(head.nodeId)	);
			return
		}
		return PinnedSelection.create(anchor, focus, origin);
	}

	eq(other: PointedSelection): boolean {
		return this.tail.eq(other.tail) && this.head.eq(other.head);
	}

	unpin(): PointedSelection {
		return this.clone()
	}

	freeze() {
		Object.freeze(this);
		return this
	}

	clone() {
		return new PointedSelection(this.tail.clone(), this.head.clone(), this.nodeIds.map(id => id.clone()), this.origin);
	}

	toString() {
		return classString(this)({
			tail: this.tail.toString(),
			head: this.head.toString()
		})
	}

	toJSON() {
		const { tail, head, nodeIds } = this;
		return { tail: tail.toString(), head: head.toString(), nodeIds: nodeIds.map(id => id.toString()) };
	}
}
