import { Radian } from './types'

export class Vector {

  static UX = Vector.of(1, 0);
  static UY = Vector.of(0, 1);

  static of(x: number, y: number) {
    return new Vector(x, y)
  }

  constructor(readonly x: number, readonly y: number) {}

  scale(f: number) {
    return Vector.of(this.x * f, this.y * f)
  }

  // radian
  rotate(angle: Radian) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    return Vector.of(this.x * cos - this.y * sin, this.y * cos + this.x * sin)
  }

  invert() {
    return Vector.of(-this.x, -this.y)
  }

  add(b: Vector) {
    return Vector.of(this.x + b.x, this.y + b.y)
  }

  sub(b: Vector) {
    return Vector.of(this.x - b.x, this.y - b.y)
  }

  dot(b: Vector) {
    return (this.x * b.x + this.y * b.y)
  }

  project(b: Vector) {
    return b.scale(this.dot(b) / b.dot(b))
  }

  angle(b: Vector) {
    return b.rotation() - this.rotation()
  }

  rotation(): number {
    return Math.atan(this.y / this.x)
  }

  // magnitude
  size(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y)
  }

  // returns a unit vector
  norm(): Vector {
    return Vector.of(this.x / this.size(), this.y / this.size())
  }

  clone(): Vector {
    return Vector.of(this.x, this.y)
  }

  toString() : string {
    return `Vector(x: ${this.x}, y:{this.y})`
  }

  toArray(): [number, number] {
    return [this.x, this.y]
  }

  toObject(): { x: number, y: number } {
    return { x: this.x, y: this.y }
  }
}
