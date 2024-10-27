import { Affine } from './Affine'
import { Point, IPoint } from './Point'
import { cloneDeep } from 'lodash'
import { Radian } from './types'

// This class is a wrapper around Affine that allows you to chain transformations.
export class Transform {

  static IDENTITY = new Transform();


  static translate(dx: number, dy: number) {
    return new Transform(Affine.translate(dx, dy))
  }

  static rotate(angle: Radian, cx?: number, cy?: number) {
    return Transform.IDENTITY.rotate(angle, cx, cy)
  }

  static scale(sx: number, sy: number, cx?: number, cy?: number) {
    return Transform.IDENTITY.scale(sx, sy, cx, cy)
  }

  static from(mat: Affine) {
    return new Transform(mat)
  }

  constructor(readonly matrix: Affine = Affine.IDENTITY) {
  }

  // translate by (x, y)
  translate(dx: number, dy: number): Transform {
    return Transform.from(this.matrix.translate(dx, dy))
  }

  // rotate around the origin (0, 0) or a point (cx, cy)
  // the cx, cy are in object local coordinate system
  rotate(angle: Radian, cx?: number, cy?: number): Transform {
    if (cx === undefined || cy === undefined) {
      const mat = this.matrix.rotate(angle)
      return Transform.from(mat)
    } else {
      const mat = this.matrix.translate(cx, cy).rotate(angle).translate(-cx, -cy)
      return Transform.from(mat)
    }
  }

  // scale around the origin (0, 0) or a point (cx, cy)
  // the cx, cy are in object local coordinate system
  scale(sx: number, sy: number, cx?: number, cy?: number): Transform {

    if (cx === undefined || cy === undefined) {
      const mat = this.matrix.scale(sx, sy)
      return Transform.from(mat)
    } else {
      const mat = this.matrix.translate(cx, cy).scale(sx, sy).translate(-cx, -cy)
      return Transform.from(mat);
    }
  }

  // get the origin point after the transformation
  origin(): IPoint {
    return this.matrix.origin();
  }

  // apply transformation to a point or an array of points
  apply<T extends (IPoint | IPoint[])>(v: T): T {
    if (Array.isArray(v)) {
      return v.map(p => this.apply(p)) as T
    } else {
      return this.matrix.apply(v) as T
    }
  }

  toSVG() {
    return this.toCSS()
  }

  toCSS() {
    return this.matrix.toCSS()
  }

  toString() {
    return `Transform(${this.matrix.toArray().join(', ')})`
  }

  clone(): Transform {
    return new Transform(cloneDeep(this.matrix))
  }
}
