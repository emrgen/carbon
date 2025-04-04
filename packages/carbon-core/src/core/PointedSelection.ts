import { Optional } from "@emrgen/types";
import { ActionOrigin } from "./actions";
import { classString } from "./Logger";
import { NodeMapGet } from "./NodeMap";
import { Pin } from "./Pin";
import { PinnedSelection } from "./PinnedSelection";
import { Point } from "./Point";

export class PointedSelection {
  static NUll = new PointedSelection(Point.NULL, Point.NULL);

  static IDENTITY = new PointedSelection(Point.IDENTITY, Point.IDENTITY);

  static SKIP = new PointedSelection(Point.SKIP, Point.SKIP);

  get isInvalid() {
    return this.isNull || this.isIdentity || this.isSkip;
  }

  static fromPoint(point: Point): PointedSelection {
    return PointedSelection.create(point, point);
  }

  static create(tail: Point, head: Point, origin = ActionOrigin.Unknown): PointedSelection {
    return new PointedSelection(tail, head, origin);
  }

  constructor(
    readonly tail: Point,
    readonly head: Point,
    public origin: ActionOrigin = ActionOrigin.Unknown,
  ) {
    if ((tail.isIdentity || head.isIdentity) && !tail.eq(head)) {
      throw new Error(
        "PointedSelection: invalid selection, one point is identity and another is not",
      );
    }
  }

  get isIdentity() {
    return this.head.nodeId.eq(Point.IDENTITY.nodeId) || this.tail.nodeId.eq(Point.IDENTITY.nodeId);
  }

  get isNull() {
    return this.head.nodeId.eq(Point.NULL.nodeId) || this.tail.nodeId.eq(Point.NULL.nodeId);
  }

  get isSkip() {
    return this.head.nodeId.eq(Point.SKIP.nodeId) || this.tail.nodeId.eq(Point.SKIP.nodeId);
  }

  get isCollapsed() {
    return this.tail.eq(this.head);
  }

  pin(nodeMap: NodeMapGet): Optional<PinnedSelection> {
    if (this.isNull) {
      return PinnedSelection.NULL;
    }

    if (this.isSkip) {
      return PinnedSelection.SKIP;
    }

    const { tail, head, origin } = this;
    // console.log('Selection.pin', head.toString());

    const focus = Pin.fromPoint(head, nodeMap);
    const anchor = Pin.fromPoint(tail, nodeMap);
    if (!focus || !anchor) {
      console.warn(
        "Selection.pin: invalid selection",
        this.toString(),
        head.toString(),
        nodeMap.get(head.nodeId),
      );
      return;
    }
    return PinnedSelection.create(anchor, focus, origin);
  }

  eq(other: PointedSelection): boolean {
    return this.tail.eq(other.tail) && this.head.eq(other.head);
  }

  unpin(): PointedSelection {
    return this.clone();
  }

  freeze() {
    Object.freeze(this);
    return this;
  }

  clone() {
    return new PointedSelection(this.tail.clone(), this.head.clone(), this.origin);
  }

  toString() {
    return classString(this)({
      tail: this.tail.toString(),
      head: this.head.toString(),
      // origin: this.origin,
    });
  }

  toJSON() {
    const { tail, head } = this;

    return { tail: tail.toString(), head: head.toString() };
  }
}
