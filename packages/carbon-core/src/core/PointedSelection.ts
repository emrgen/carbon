import { Point } from "./Point";
import { NodeId } from "./NodeId";
import { Optional } from "@emrgen/types";
import { PinnedSelection } from "./PinnedSelection";
import { Pin } from "./Pin";
import { classString } from "./Logger";
import { ActionOrigin } from "./actions";
import { NodeMap } from "./NodeMap";
import { Node, NodeIdSet } from "@emrgen/carbon-core";
import { flatten } from "lodash";

export class PointedSelection {

	static NUll = new PointedSelection(Point.NULL, Point.NULL, []);

	static IDENTITY = new PointedSelection(Point.IDENTITY, Point.IDENTITY, []);

	get isInvalid() {
		return this.head.isNull || this.tail.isNull;
	}

	static atStart(nodeId: NodeId, offset: number = 0) {
		return PointedSelection.fromPoint(Point.toStart(nodeId, offset))
	}

	static fromPoint(point: Point): PointedSelection {
		return PointedSelection.create(point, point, []);
	}

	static fromNodes(nodeIds: NodeId | NodeId[], origin: ActionOrigin = ActionOrigin.Unknown) {
		const set = new NodeIdSet(flatten([nodeIds]) as NodeId[]);
		return new PointedSelection(Point.IDENTITY, Point.IDENTITY, set.toArray(), origin);
	}

	static create(tail: Point, head: Point, nodeIds: NodeId[] = [], origin = ActionOrigin.Unknown): PointedSelection {
		return new PointedSelection(tail, head, [], origin);
	}

	constructor(readonly tail: Point, readonly head: Point, readonly nodeIds: NodeId[], public origin: ActionOrigin = ActionOrigin.Unknown) {
    if ((tail.isIdentity || head.isIdentity) && !tail.eq(head)) {
      throw new Error('PointedSelection: invalid selection, one point is identity and another is not');
    }
	}

	get isIdentity() {
		return this.eq(PointedSelection.IDENTITY);
	}

	get isNull() {
		return this.eq(PointedSelection.NUll);
	}

	get isBlock() {
		// console.log('PointedSelection.isBlock', this.nodeIds.length, this.eq(PointedSelection.IDENTITY));
		return this.eq(PointedSelection.IDENTITY) && this.nodeIds.length > 0;
	}

	get isInline() {
		return !this.head.isIdentity && !this.tail.isIdentity && this.nodeIds.length === 0;
	}

  get isInlineBlock() {
    return this.isInline && this.nodeIds.length > 0
  }

	get isCollapsed() {
		return this.tail.eq(this.head);
	}

	pin(store: NodeMap): Optional<PinnedSelection> {
		if (this.isNull) {
			return PinnedSelection.NULL;
		}

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
		const set = new NodeIdSet(this.nodeIds);
		const nodesEq = other.nodeIds.every(id => set.has(id));

		return nodesEq && this.tail.eq(other.tail) && this.head.eq(other.head);
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
		if (this.isBlock) {
			return classString(this)(this.nodeIds.map(id => id.toString()));
		}

		return classString(this)({
			tail: this.tail.toString(),
			head: this.head.toString(),
			// origin: this.origin,
		})
	}

	toJSON() {
		const { tail, head, nodeIds } = this;

		if (this.isBlock) {
			return { nodeIds: nodeIds.map(id => id.toString()) };
		}

		return { tail: tail.toString(), head: head.toString() }
	}
}
