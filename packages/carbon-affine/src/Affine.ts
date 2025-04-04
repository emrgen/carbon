import {
  compose,
  fromDefinition,
  fromTransformAttribute,
} from "transformation-matrix";
import { UINT_MAX, UINT_MIN } from "./contant";
import { IPoint } from "./Point";
import { Radian } from "./types";
import { abs, clampScale, considerZero } from "./utils";
import { Vector } from "./Vector";

// affine transformation matrix, 2x3 matrix
type AffineMatrix = [number, number, number, number, number, number];

// affine transformation matrix
export class Affine {
  static IDENTITY = new Affine([1, 0, 0, 0, 1, 0]);

  static fromSize(width: number, height: number) {
    return Affine.scale(width / 2, height / 2);
  }

  // create an affine transformation matrix from a CSS transform string
  // assuming the string is a matrix or a combination of translate, rotate, scale
  // TODO: this is not a complete implementation of the CSS transform
  static fromCSS(css: string) {
    const mat = css.match(
      /matrix\(([^,]+), ([^,]+), ([^,]+), ([^,]+), ([^,]+), ([^,]+)\)/,
    );

    if (mat) {
      return new Affine([
        parseFloat(mat[1]),
        parseFloat(mat[3]),
        parseFloat(mat[5]),
        parseFloat(mat[2]),
        parseFloat(mat[4]),
        parseFloat(mat[6]),
      ]);
    } else {
      const { a, b, c, d, e, f } = compose(
        fromDefinition(fromTransformAttribute(css)),
      );
      return new Affine([a, b, c, d, e, f]);
    }
  }

  static translate(x: number, y: number) {
    return new Affine([1, 0, x, 0, 1, y]);
  }

  static rotate(angle: Radian) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    return new Affine([cos, -sin, 0, sin, cos, 0]);
  }

  static scale(x: number, y: number) {
    return new Affine([x, 0, 0, 0, y, 0]);
  }

  static flipX() {
    return new Affine([-1, 0, 0, 0, 1, 0]);
  }

  static flipY() {
    return new Affine([1, 0, 0, 0, -1, 0]);
  }

  static skew(angleX: Radian, angleY: Radian) {
    return new Affine([1, Math.tan(angleY), 0, Math.tan(angleX), 1, 0]);
  }

  static mul(a: Affine, b: Affine) {
    const matA = a.mat;
    const matB = b.mat;

    return new Affine([
      matA[0] * matB[0] + matA[1] * matB[3],
      matA[0] * matB[1] + matA[1] * matB[4],
      matA[0] * matB[2] + matA[1] * matB[5] + matA[2],
      matA[3] * matB[0] + matA[4] * matB[3],
      matA[3] * matB[1] + matA[4] * matB[4],
      matA[3] * matB[2] + matA[4] * matB[5] + matA[5],
    ]);
  }

  static transform(a: Affine, b: IPoint) {
    const mat = a.mat;
    return {
      x: mat[0] * b.x + mat[1] * b.y + mat[2],
      y: mat[3] * b.x + mat[4] * b.y + mat[5],
    };
  }

  constructor(readonly mat: AffineMatrix) {}

  get angle() {
    return Math.atan2(this.mat[3], this.mat[4]);
  }

  get scaleX() {
    return;
  }

  // r -> s -> t
  // need to be careful about the order
  // when applying the transformation to a point the order is t -> s -> r
  decompose() {
    const translation = this.translation();
    const map = this.mul(translation.inverse());
    const scaling = map.scaling();
    const rotation = map.mul(scaling.inverse());

    // const translation = map.translation();
    return { translation, rotation, scaling };
  }

  // return the rotation matrix
  rotation(): Affine {
    const [a, b, c, d, e, f] = this.mat;
    return new Affine([a, b, 0, d, e, 0]);
  }

  // return the scaling matrix
  scaling(): Affine {
    const [a, , , , e] = this.mat;
    return new Affine([a, 0, 0, 0, e, 0]);
  }

  // return the translation matrix
  translation(): Affine {
    const [, , c, , , f] = this.mat;
    return new Affine([1, 0, c, 0, 1, f]);
  }

  translate(x: number, y: number) {
    return this.mul(Affine.translate(x, y));
  }

  rotate(angle: Radian) {
    return this.mul(Affine.rotate(angle));
  }

  // NOTE: scale happens wrt the origin (0, 0) in object local coordinate system
  scale(sx: number, sy: number) {
    // clamp to avoid scale to zero
    const sax = clampScale(sx, UINT_MIN, UINT_MAX);
    const say = clampScale(sy, UINT_MIN, UINT_MAX);

    return this.mul(Affine.scale(sax, say));
  }

  flipX() {
    return this.mul(Affine.flipX());
  }

  flipY() {
    return this.mul(Affine.flipY());
  }

  skew(angleX: Radian, angleY: Radian) {
    return this.mul(Affine.skew(angleX, angleY));
  }

  origin() {
    return this.apply({ x: 0, y: 0 });
  }

  mul(...b: Affine[]) {
    return b.reduce((acc, m) => Affine.mul(acc, m), this);
  }

  inverse() {
    const a = this.mat;
    const det = a[0] * a[4] - a[1] * a[3];

    return new Affine(
      this.sanitize([
        a[4] / det,
        -a[1] / det,
        (a[1] * a[5] - a[2] * a[4]) / det,
        -a[3] / det,
        a[0] / det,
        (a[2] * a[3] - a[0] * a[5]) / det,
      ]),
    );
  }

  sanitize(arr: AffineMatrix) {
    return arr.map((n) => (-n == n ? abs(n) : n)) as AffineMatrix;
  }

  // check if the matrix has an inverse
  // TODO: check if the determinant is zero
  hasInverse() {
    const a = this.mat;
    return a[0] * a[4] - a[1] * a[3] !== 0;
  }

  // apply transformation to a point or an array of points
  apply<T extends IPoint | IPoint[]>(v: T): T {
    if (Array.isArray(v)) {
      return v.map((p) => this.apply(p)) as T;
    } else {
      return Affine.transform(this, v) as T;
    }
  }

  toString() {
    return `Affine(${this.mat.join(", ")})`;
  }

  toSVG() {
    return this.toCSS();
  }

  toCSS() {
    const els = this.mat
      .map(considerZero)
      .map((n) => (n == -n ? abs(n).toFixed(5) : n.toFixed(5)));
    return `matrix(${els[0]}, ${els[3]}, ${els[1]}, ${els[4]}, ${els[2]}, ${els[5]})`;
  }

  toArray() {
    return [...this.mat];
  }

  clone() {
    return new Affine([...this.mat]);
  }

  eq(af: Affine) {
    return this.mat.every((n, i) => n.toFixed(5) === af.mat[i].toString(5));
  }

  xAxis() {
    return Vector.UX.transform(this);
  }

  yAxis() {
    return Vector.UY.transform(this);
  }
}
