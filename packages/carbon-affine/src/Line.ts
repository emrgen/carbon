import { Optional } from "@emrgen/types";
import { Affine } from "./Affine";
import { UINT_MIN } from "./contant";
import { IPoint, Point } from "./Point";
import { abs } from "./utils";
import { Vector } from "./Vector";

// Line in 2D space represents a straight line defined by two points: start and end.
export class Line {
  // the horizontal line (0, 0) to (1, 0)
  static UX = Line.fromPoints(Point.ORIGIN, { x: 1, y: 0 });
  // the vertical line (0, 0) to (0, 1)
  static UY = Line.fromPoints(Point.ORIGIN, { x: 0, y: 1 });

  // the line from (0, 0) to (1, 1)
  static of(x: number, y: number) {
    return new Line(Point.ORIGIN, { x, y });
  }

  static fromPoint(point: IPoint) {
    return new Line(Point.ORIGIN, point);
  }

  static fromPoints(start: IPoint | IPoint[], end: IPoint) {
    if (Array.isArray(start)) {
      return new Line(start[0], start[1]);
    }
    return new Line(start, end);
  }

  // get the intersection point of two lines
  // returns undefined if the lines are parallel or coincident
  static intersection(l1: Line, l2: Line): IPoint | undefined {
    const x1 = l1.start.x;
    const y1 = l1.start.y;
    const x2 = l1.end.x;
    const y2 = l1.end.y;
    const x3 = l2.start.x;
    const y3 = l2.start.y;
    const x4 = l2.end.x;
    const y4 = l2.end.y;

    const d = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
    if (d === 0) {
      return undefined;
    }

    const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / d;
    const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / d;

    if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
      return {
        x: x1 + t * (x2 - x1),
        y: y1 + t * (y2 - y1),
      };
    }

    return undefined;
  }

  // check if the line is an instance of Line
  static is(line: any): line is Line {
    return line instanceof Line;
  }

  constructor(
    readonly start: IPoint,
    readonly end: IPoint,
  ) {}

  get length() {
    return Math.hypot(this.end.x - this.start.x, this.end.y - this.start.y);
  }

  get dx() {
    return abs(this.end.x - this.start.x);
  }

  get dy() {
    return abs(this.end.y - this.start.y);
  }

  get angle() {
    return Math.atan2(this.end.y - this.start.y, this.end.x - this.start.x);
  }

  get center() {
    return {
      x: (this.start.x + this.end.x) / 2,
      y: (this.start.y + this.end.y) / 2,
    };
  }

  projection(on: Vector): Vector {
    const v = this.vector();
    const unit = on.unit();
    const dot = unit.dot(v);
    return unit.scale(dot);
  }

  transform(tm: Affine): Line {
    return new Line(tm.apply(this.start), tm.apply(this.end));
  }

  angleBetween(line: Line) {
    return this.angle - line.angle;
  }

  intersects(line: Line) {
    return Line.intersection(this, line) !== undefined;
  }

  intersection(line: Line): Optional<IPoint> {
    return Line.intersection(this, line);
  }

  extendEnd(length: number) {
    const v = this.vector().norm();
    return new Line(this.start, {
      x: this.end.x + v.x * length,
      y: this.end.y + v.y * length,
    });
  }

  extendStart(length: number) {
    const v = this.vector().norm();
    return new Line(
      {
        x: this.start.x - v.x * length,
        y: this.start.y - v.y * length,
      },
      this.end,
    );
  }

  // get the distance from a point to a line
  distance(p: IPoint) {
    const x1 = this.start.x;
    const y1 = this.start.y;
    const x2 = this.end.x;
    const y2 = this.end.y;
    const x0 = p.x;
    const y0 = p.y;

    return Math.abs((x2 - x1) * (y1 - y0) - (x1 - x0) * (y2 - y1)) / this.length;
  }

  // get the distance from a point to a line segment
  distanceToSegment(p: IPoint) {
    const x1 = this.start.x;
    const y1 = this.start.y;
    const x2 = this.end.x;
    const y2 = this.end.y;
    const x0 = p.x;
    const y0 = p.y;

    const l2 = (x2 - x1) ** 2 + (y2 - y1) ** 2;
    if (l2 === 0) {
      return Math.hypot(x1 - x0, y1 - y0);
    }

    const t = Math.max(0, Math.min(1, ((x0 - x1) * (x2 - x1) + (y0 - y1) * (y2 - y1)) / l2));
    const projection = {
      x: x1 + t * (x2 - x1),
      y: y1 + t * (y2 - y1),
    };

    return Math.hypot(projection.x - x0, projection.y - y0);
  }

  // get the point on the line that is closest to the given point
  closestPoint(p: IPoint) {
    const x1 = this.start.x;
    const y1 = this.start.y;
    const x2 = this.end.x;
    const y2 = this.end.y;
    const x0 = p.x;
    const y0 = p.y;

    // length of the line segment
    const l2 = (x2 - x1) ** 2 + (y2 - y1) ** 2;
    if (Math.abs(l2) < UINT_MIN) {
      return this.start;
    }

    // projection of point on the line segment
    const t = Math.max(0, Math.min(1, ((x0 - x1) * (x2 - x1) + (y0 - y1) * (y2 - y1)) / l2));
    return {
      x: x1 + t * (x2 - x1),
      y: y1 + t * (y2 - y1),
    };
  }

  // get the point on the line that is closest to the given point
  projectionPoint(p: IPoint) {
    return this.extendEnd(1e8).extendStart(1e8).closestPoint(p);
  }

  prevLine(p: Point) {
    return new Line(p, this.start);
  }

  nextLine(p: Point) {
    return new Line(this.end, p);
  }

  // get the vector of the line
  vector() {
    return Vector.of(this.end.x - this.start.x, this.end.y - this.start.y);
  }

  // move the line by the given distance
  moveEndBy(dx: number, dy: number) {
    return new Line(this.start, {
      x: this.end.x + dx,
      y: this.end.y + dy,
    });
  }

  moveStartBy(dx: number, dy: number) {
    return new Line(
      {
        x: this.start.x + dx,
        y: this.start.y + dy,
      },
      this.end,
    );
  }

  moveEndTo(point: IPoint) {
    return new Line(this.start, point);
  }

  moveStartTo(point: IPoint) {
    return new Line(point, this.end);
  }

  onSameSide(p1: IPoint, p2: IPoint) {
    const { start, end } = this;
    const { x: x1, y: y1 } = start;
    const { x: x2, y: y2 } = end;
    const { x: x3, y: y3 } = p1;
    const { x: x4, y: y4 } = p2;

    return !(
      ((x2 - x1) * (y3 - y1) - (y2 - y1) * (x3 - x1)) *
        ((x2 - x1) * (y4 - y1) - (y2 - y1) * (x4 - x1)) <
      0
    );
  }

  // get the factor of the point on the line
  pointLength(refPoint: IPoint) {
    // check if the point is on the line
    if (this.distance(refPoint) < UINT_MIN) {
      return 0;
    }

    return Math.hypot(this.start.x - refPoint.x, this.start.y - refPoint.y);
  }

  // get the point on the line at the given length
  pointAtLength(len: number) {
    const lenRatio = len / this.length;
    return {
      x: this.start.x + (this.end.x - this.start.x) * lenRatio,
      y: this.start.y + (this.end.y - this.start.y) * lenRatio,
    };
  }

  // shift the line parallel to the given line
  // after the shift the start point of the line will be at the given point and the length will be the same
  shiftTo(point: IPoint): Line {
    const v = this.vector().norm().multiply(this.length);
    return new Line(point, {
      x: point.x + v.x,
      y: point.y + v.y,
    });
  }

  // get the middle point of the line
  middle(): IPoint {
    return {
      x: (this.start.x + this.end.x) / 2,
      y: (this.start.y + this.end.y) / 2,
    };
  }
}
