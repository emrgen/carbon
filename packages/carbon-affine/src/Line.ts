import { IPoint, Point } from './Point';
import { Affine } from './Affine';
import { abs } from './utils';

export class Line {

  // get the intersection point of two lines
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
        y: y1 + t * (y2 - y1)
      };
    }

    return undefined;
  }

  static of(x: number, y: number) {
    return new Line(Point.ORIGIN, { x, y });
  }

  static fromPoint(point: IPoint) {
    return new Line(Point.ORIGIN, point);
  }

  static fromPoints(start: IPoint|IPoint[], end: IPoint) {
    if (Array.isArray(start)) {
      return new Line(start[0], start[1]);
    }
    return new Line(start, end);
  }

  constructor(readonly start: IPoint, readonly end: IPoint) {}

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
      y: (this.start.y + this.end.y) / 2
    }
  }

  transform(tm: Affine): Line {
    console.log(this.start, this.end);
    console.log('X', tm.apply(this.start), tm.apply(this.end));
    
    return new Line(tm.apply(this.start), tm.apply(this.end));
  }

  angleBetween(line: Line) {
    return Math.acos(
      (this.end.x - this.start.x) * (line.end.x - line.start.x) +
      (this.end.y - this.start.y) * (line.end.y - line.start.y)
    );
  }

  intersects(line: Line) {
    return Line.intersection(this, line) !== undefined;
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
      y: y1 + t * (y2 - y1)
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

    const l2 = (x2 - x1) ** 2 + (y2 - y1) ** 2;
    if (l2 === 0) {
      return this.start;
    }

    const t = Math.max(0, Math.min(1, ((x0 - x1) * (x2 - x1) + (y0 - y1) * (y2 - y1)) / l2));
    return {
      x: x1 + t * (x2 - x1),
      y: y1 + t * (y2 - y1)
    };
  }

  prevLine(p: Point) {
    return new Line(p, this.start);
  }

  nextLine(p: Point) {
    return new Line(this.end, p);
  }

}
