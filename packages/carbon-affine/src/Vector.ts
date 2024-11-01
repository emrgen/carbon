import { round } from "lodash";
import { Affine } from "./Affine";
import { Radian } from "./types";
import { abs, considerZero } from "./utils";

export class Vector {
  static UX = Vector.of(1, 0);
  static UY = Vector.of(0, 1);

  static of(x: number, y: number) {
    return new Vector(x, y);
  }

  static fromAngle(angle: Radian) {
    return Vector.of(Math.cos(angle), Math.sin(angle)).norm();
  }

  static fromArray(arr: [number, number]) {
    return new Vector(arr[0], arr[1]);
  }

  static fromObject(obj: { x: number; y: number }) {
    return new Vector(obj.x, obj.y);
  }

  constructor(
    readonly x: number,
    readonly y: number,
  ) {}

  scale(f: number) {
    return Vector.of(this.x * f, this.y * f);
  }

  // radian
  rotate(angle: Radian) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    return Vector.of(this.x * cos - this.y * sin, this.y * cos + this.x * sin);
  }

  invert() {
    return Vector.of(-this.x, -this.y);
  }

  add(b: Vector) {
    return Vector.of(this.x + b.x, this.y + b.y);
  }

  sub(b: Vector) {
    return Vector.of(this.x - b.x, this.y - b.y);
  }

  dot(b: Vector) {
    return this.x * b.x + this.y * b.y;
  }

  project(b: Vector) {
    return b.scale(this.dot(b) / b.dot(b));
  }

  angleBetween(b: Vector) {
    // console.log(b.angle(), this.angle());
    return b.angle - this.angle;
  }

  divide(b: Vector) {
    return Vector.of(this.x / b.x, this.y / b.y);
  }

  factorOf(b: Vector) {
    const angle = this.angleBetween(b);
    if (considerZero(angle) === 0) {
      return this.size() / b.size();
    } else if (abs(round(angle, 10)) === round(Math.PI, 10)) {
      return -this.size() / b.size();
    }

    throw new Error("the two vectors are not in the same direction");
  }

  get angle(): number {
    const angle = Math.atan2(this.y, this.x);
    return angle;
    // return angle < 0 ? angle + Math.PI * 2 : angle;
  }

  transform(matrix: Affine): Vector {
    const p = matrix.apply(this);
    return Vector.of(p.x, p.y);
  }

  // magnitude
  size(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  // returns a unit vector
  norm(): Vector {
    return Vector.of(this.x / this.size(), this.y / this.size());
  }

  clone(): Vector {
    return Vector.of(this.x, this.y);
  }

  toString(): string {
    return `Vector(x: ${this.x}, y:{this.y})`;
  }

  toArray(): [number, number] {
    return [this.x, this.y];
  }

  toObject(): { x: number; y: number } {
    return { x: this.x, y: this.y };
  }

  unit() {
    return this.norm();
  }

  multiply(number: number) {
    return Vector.of(this.x * number, this.y * number);
  }
}
