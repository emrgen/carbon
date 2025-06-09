import { Affine } from "./Affine";

export interface IPoint {
  x: number;
  y: number;
}

// Point class represents a 2D point in space.
export class Point {
  // the origin point (0, 0)
  static ORIGIN = new Point(0, 0);
  // unit vectors
  static UX = new Point(1, 0);
  static UY = new Point(0, 1);

  static of(x: number, y: number) {
    return new Point(x, y);
  }

  static from(p: IPoint) {
    return new Point(p.x, p.y);
  }

  static create(x: number, y: number) {
    return new Point(x, y);
  }

  constructor(
    readonly x: number,
    readonly y: number,
  ) {}

  // vector head addition
  add(p: Point): Point {
    return new Point(this.x + p.x, this.y + p.y);
  }

  // vector head subtraction
  sub(p: Point): Point {
    return new Point(this.x - p.x, this.y - p.y);
  }

  // move the point by a delta (dx, dy)
  move(dx: number, dy: number) {
    return new Point(this.x + dx, this.y + dy);
  }

  // apply an Affine transformation to this point
  transform(tm: Affine): Point {
    return tm.apply(this);
  }
}
