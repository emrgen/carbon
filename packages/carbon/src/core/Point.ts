import { NodeId } from './NodeId';
import { classString } from './Logger';

enum PointAt {
	Before = 0,
	Within = 1,
	After = 2,
}

export class Point {
	nodeId: NodeId;

	// points at before|within|after
	private at: PointAt;

	// valid when point is within a node
	offset: number;

	get isDefault() {
		return this.nodeId.isDefault
	}

	get isWithin(): boolean {
		return this.at === PointAt.Within;
	}

	get isBefore(): boolean {
		return this.at === PointAt.Before;
	}

	get isAfter(): boolean {
		return this.at === PointAt.After;
	}

	static toBefore(nodeId: NodeId) {
		return new Point(nodeId, 0);
	}

	// point to after the id
	static toAfter(nodeId: NodeId) {
		return new Point(nodeId, 2);
	}

	static toWithin(nodeId: NodeId, offset: number) {
		return new Point(nodeId, 1, offset);
	}

	static create(nodeId: NodeId, at: PointAt, offset: number = -1) {
		return new Point(nodeId, at, offset);
	}

	constructor(nodeId: NodeId, at: PointAt, offset: number = -1) {
		this.nodeId = nodeId;
		this.at = at;
		this.offset = offset;
	}

	eq(other: Point) {
		return this.nodeId.eq(other.nodeId) && this.at === other.at && this.offset === other.offset;
	}

	clone() {
		return Point.create(this.nodeId.clone(), this.at, this.offset)
	}

	toString() {
		const {nodeId, at} = this;
		return classString(this)({
			nodeId,
			at,
		})
	}
}
