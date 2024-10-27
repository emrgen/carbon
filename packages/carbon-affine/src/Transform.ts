import { Affine } from './Affine'
import { Point } from './types'
import { cloneDeep } from 'lodash'

// This class is a wrapper around Affine that allows you to chain transformations.
export class Transform {

  static from(mat: Affine) {
    return new Transform(mat)
  }

  constructor(readonly matrix: Affine = Affine.IDENTITY) {
  }

  translate(x: number, y: number) {
    return Transform.from(this.matrix.translate(x, y))
  }

  rotate(angle: number, cx?: number, cy?: number) {
    if (cx === undefined || cy === undefined) {
      const mat = this.matrix.rotate(angle)
      return Transform.from(mat)
    } else {
      const mat = this.matrix.translate(cx, cy).rotate(angle).translate(-cx, -cy)
      return Transform.from(mat)
    }
  }

  scale(x: number, y: number, cx?: number, cy?: number) {
    if (cx === undefined || cy === undefined) {
      const mat = this.matrix.scale(x, y)
      return Transform.from(mat)
    } else {
      const mat = this.matrix.translate(cx, cy).scale(x, y).translate(-cx, -cy)
      return Transform.from(mat);
    }
  }

  // apply transformation to a point or an array of points
  apply<T extends (Point | Point[])>(v: T): T {
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

  clone() {
    return new Transform(cloneDeep(this.matrix))
  }
}
