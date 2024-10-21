import { IntoNodeId, NodeId } from "./NodeId";
import { classString } from "./Logger";
import { Maps } from "./types";
import { Align } from "./Focus";

export enum PointAt {
  Start = "start",
  Before = "before",
  Inside = "inside",
  After = "after",
  End = "end",
}

// point is a relative offset position within a node
export class Point {
  nodeId: NodeId;

  // points at before|within|after
  at: PointAt;

  // valid when point is within a node
  offset: number;

  // carrying precise location information
  steps: number;

  align: Align;

  static IDENTITY = new Point(NodeId.IDENTITY, PointAt.Inside, 0);
  static NULL = new Point(NodeId.NULL, PointAt.Inside, 0);
  static SKIP = new Point(NodeId.SKIP, PointAt.Inside, 0);

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
  static atOffset(
    nodeId: IntoNodeId,
    offset: number = 0,
    steps: number = -1,
    align: Align = Align.Left,
  ) {
    return new Point(nodeId, PointAt.Start, offset, steps, align);
  }

  static toBefore(nodeId: IntoNodeId) {
    return new Point(nodeId, PointAt.Before, 0, 0);
  }

  // point to after the id
  static toAfter(nodeId: IntoNodeId) {
    return new Point(nodeId, PointAt.After);
  }

  // point to after end of the node children
  static toInside(nodeId: IntoNodeId) {
    return new Point(nodeId, PointAt.Inside);
  }

  static create(
    nodeId: IntoNodeId,
    at: PointAt,
    offset: number = 0,
    steps: number = -1,
  ) {
    return new Point(nodeId, at, offset, steps);
  }

  constructor(
    nodeId: IntoNodeId,
    at: PointAt,
    offset: number = 0,
    steps: number = -1,
    align: Align = Align.Left,
  ) {
    this.nodeId = nodeId.nodeId();
    this.at = at;
    this.offset = offset;
    this.steps = steps;
    this.align = align;
  }

  map<B>(fn: Maps<Point, B>) {
    return fn(this);
  }

  eq(other: Point) {
    return (
      this.nodeId.eq(other.nodeId) &&
      this.at === other.at &&
      this.offset === other.offset &&
      this.steps === other.steps
    );
  }

  clone() {
    return Point.create(this.nodeId.clone(), this.at, this.offset, this.steps);
  }

  toString() {
    const { nodeId, at, offset, steps, align } = this;
    return classString(this)(
      `${nodeId.toString()}/${at}/${offset}/${steps}/${align}`,
    );
  }

  toJSON() {
    return {
      id: this.nodeId.toString(),
      at: this.at,
      offset: this.offset,
      align: this.align,
    };
  }

  static fromJSON(json: any) {
    return Point.create(NodeId.fromString(json.id), json.at, json.offset);
  }
}
