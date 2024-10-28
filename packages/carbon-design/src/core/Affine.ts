import { CSSProperties } from "react";
import { Matrix, rotateDEG, translate } from "transformation-matrix";

// affine keeps the style and the matrices in sync
// style does not allow scale(scaling happens by width and height)
// matrices are the actual transformation matrices
// at any point applying the matrices to a unit square will give the style
export class Affine {
  matrices: Matrix[] = [];

  static fromCSS(style: CSSProperties) {
    const { width, height, transform } = style;
    const [w, h] = [
      parseInt(width?.toString() ?? "0"),
      parseInt(height?.toString() ?? "0"),
    ];

    const transformMatrix = transform?.match(/matrix\((.*)\)/);

    if (transformMatrix) {
      const matrix = transformMatrix[1].split(",").map((v) => parseFloat(v));
      const [a, b, c, d, e, f] = matrix;

      const angle = Math.atan2(b, a) * (180 / Math.PI);
      const cx = e;
      const cy = f;

      return new Affine({ cx, cy, w, h, angle });
    }

    return new Affine({
      cx: 0,
      cy: 0,
      w,
      h,
      angle: 0,
    });
  }

  constructor(style: TransformSpec, matrices: Matrix[] = []) {
    this.style = style;
    this.matrices = matrices;
  }

  translate(x: number, y: number) {
    this.matrices.push(translate(x, y));
    return this;
  }

  // rotate always happens wrt the center
  rotate(angle: number) {
    this.matrices.push(rotateDEG(angle));
    return this;
  }

  // scale always happens wrt the center and at zero rotation
  scale(sx: number, sy: number) {
    // this.matrices.push(scale(sx, sy, this.cx, this.cy));
    return this;
  }

  // toCSS(): CSSProperties {
  //   const mats: Matrix[] = [identity()];
  //   const { cx, cy, angle } = this.spec;
  //
  //   // console.log("cx, cy, angle", cx, cy, angle);
  //
  //   mats.push(translate(cx, cy));
  //   mats.push(rotateDEG(angle));
  //   mats.push(...this.matrices);
  //
  //   const { w, h } = this.spec;
  //   return {
  //     transform: toCSS(compose(...mats)),
  //     width: w,
  //     height: h,
  //   };
  // }

  // resize(sx: number, sy: number, cx: number, cy: number) {
  //   // new center
  //   const center = applyToPoint(scale(sx, sy, cx, cy), {
  //     x: this.cx,
  //     y: this.cy,
  //   });
  //
  //   this.rotate(-this.angle)
  //     .translate(-this.cx, -this.cy)
  //     .scale(sx, sy)
  //     .translate(center.x - 10, center.y)
  //     .rotate(this.angle); // this may not be correct
  // }
}

export interface TransformSpec {
  cx: number;
  cy: number;
  w: number;
  h: number;
  angle: number;
}