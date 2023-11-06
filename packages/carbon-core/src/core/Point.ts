import { IntoNodeId, NodeId } from './NodeId';
import { classString } from './Logger';
import { Maps } from './types';

enum PointAt {
	Start = 0,
	Before = 1,
	After = 2,
	End = 3,
}

// point is a relative offset position within a node
export class Point {
	nodeId: NodeId;

	// points at before|within|after
	private at: PointAt;

	// valid when point is within a node
	offset: number;

	get isDefault() {
		return this.nodeId.isDefault
	}

	get isStart(): boolean {
		return this.at === PointAt.Start;
	}

	get isEnd(): boolean {
		return this.at === PointAt.End;
	}

	get isBefore(): boolean {
		return this.at === PointAt.Before;
	}

	get isAfter(): boolean {
		return this.at === PointAt.After;
	}

	// point to before start of the node children
	static toStart(nodeId: IntoNodeId, offset: number = 0) {
		return new Point(nodeId, PointAt.Start, offset);
	}

	static toBefore(nodeId: IntoNodeId) {
		return new Point(nodeId, PointAt.Before);
	}

	// point to after the id
	static toAfter(nodeId: IntoNodeId) {
		return new Point(nodeId, PointAt.After);
	}

	// point to after end of the node children
	static toEnd(nodeId: IntoNodeId, offset: number) {
		return new Point(nodeId, PointAt.End, offset);
	}

	static create(nodeId: IntoNodeId, at: PointAt, offset: number = 0) {
		return new Point(nodeId, at, offset);
	}

	constructor(nodeId: IntoNodeId, at: PointAt, offset: number = -1) {
		this.nodeId = nodeId.intoNodeId();
		this.at = at;
		this.offset = offset;
	}

	map<B>(fn: Maps<Point, B>) {
		return fn(this)
	}

	eq(other: Point) {
		return this.nodeId.eq(other.nodeId) && this.at === other.at && this.offset === other.offset;
	}

	clone() {
		return Point.create(this.nodeId.clone(), this.at, this.offset)
	}

	toString() {
		const {nodeId, at, offset} = this;
		return classString(this)(`${nodeId.toString()}/${at}/${offset}`)
	}
}
