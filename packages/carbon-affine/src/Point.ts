import { Affine } from "./Affine";

export interface IPoint {
  x: number;
  y: number;
}

export class Point {
  static ORIGIN = new Point(0, 0);
  static UNIT_X = new Point(1, 0);
  static UNIT_Y = new Point(0, 1);

  constructor(
    readonly x: number,
    readonly y: number,
  ) {}

  add(p: Point): Point {
    return new Point(this.x + p.x, this.y + p.y);
  }

  sub(p: Point): Point {
    return new Point(this.x - p.x, this.y - p.y);
  }

  transform(tm: Affine): Point {
    return tm.apply(this);
  }

  static from(p: { x: number; y: number }) {
    return new Point(p.x, p.y);
  }

  move(dx: number, dy: number) {
    return new Point(this.x + dx, this.y + dy);
  }
}
