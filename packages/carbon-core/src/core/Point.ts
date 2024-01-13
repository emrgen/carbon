import { IntoNodeId, NodeId } from './NodeId';
import { classString } from './Logger';
import { Maps } from './types';

export enum PointAt {
	Start = 'start',
	Before = 'before',
	Inside = 'inside',
	After = 'after',
	End = 'end'
}

// point is a relative offset position within a node
export class Point {
	nodeId: NodeId;

	// points at before|within|after
	at: PointAt;

	// valid when point is within a node
	offset: number;

	static IDENTITY = new Point(NodeId.IDENTITY, PointAt.Inside, 0);
	static NULL = new Point(NodeId.NULL, PointAt.Inside, 0);

	get isIdentity() {
		return this.eq(Point.IDENTITY);
	}

	get isNull() {
		return this.eq(Point.NULL);
	}

	get isStart(): boolean {
		return this.at === PointAt.Start;
	}

	get isWithin(): boolean {
		return this.at === PointAt.Inside;
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
	static toInside(nodeId: IntoNodeId) {
		return new Point(nodeId, PointAt.Inside);
	}

	static create(nodeId: IntoNodeId, at: PointAt, offset: number = 0) {
		return new Point(nodeId, at, offset);
	}

	constructor(nodeId: IntoNodeId, at: PointAt, offset: number = -1) {
		this.nodeId = nodeId.nodeId();
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

  toJSON() {
    return {
      id: this.nodeId.toString(),
      at: this.at,
      offset: this.offset,
    }
  }

  static fromJSON(json: any) {
    return Point.create(NodeId.create(json.id), json.at, json.offset)
  }
}
