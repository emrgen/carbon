import { Affine } from "./Affine";
import { Transform } from "./Transform";
import { Radian } from "./types";

export enum ResizeRef {
  CENTER = "center",
  TOP_LEFT = "top-left",
  TOP_RIGHT = "top-right",
  BOTTOM_LEFT = "bottom-left",
  BOTTOM_RIGHT = "bottom-right",
  TOP = "top",
  BOTTOM = "bottom",
  LEFT = "left",
  RIGHT = "right",
}

export enum ResizeRatio {
  FREE = "free",
  KEEP = "keep",
  KEEP_X = "keep-x",
  KEEP_Y = "keep-y",
}

// initial shape is a square with the center at (0, 0) and the side length is 1
export class Shaper {
  tm: Transform;

  static default() {
    return Shaper.from(Transform.from(Affine.IDENTITY));
  }

  static fromCSS(css: string) {
    return this.from(Transform.from(Affine.fromCSS(css)));
  }

  static from(tm: Transform) {
    return new Shaper(tm)
  }

  constructor(tm: Transform) {
    this.tm = tm;
  }

  translate(dx: number, dy: number): Affine {
    return this.tm.translate(dx, dy).matrix;
  }

  rotate(angle: Radian, cx?: number, cy?: number): Affine {
    return this.tm.rotate(angle, cx, cy).matrix;
  }

  // dx, dy are the distance of the mouse move
  resize(dx: number, dy: number, ref: ResizeRef, ratio: ResizeRatio): Affine {
    // get the reference point in the current coordinate system
    const {x: lcx, y: lcy} = this.tm.apply(this.refPoint(ref));
    // get the current size of the shape
    const {width: lcw, height: lch} = this.currentSize();
    // calculate the scaling factor in x and y direction
    const {x: ldsx, y: ldsy} = this.tm.apply({x: dx, y: dy});
    const lsx = ldsx + lcx;
    const lsy = ldsy + lcy;

    switch (ratio) {
      case ResizeRatio.FREE:
        return this.tm.scale(lsx / lcw, lsy / lch).matrix;
      case ResizeRatio.KEEP:
        const s = Math.max(lsx / lcw, lsy / lch);
        return this.tm.scale(s, s).matrix;
      case ResizeRatio.KEEP_X:
        return this.tm.scale(lsx / lcw, 1).matrix;
      case ResizeRatio.KEEP_Y:
        return this.tm.scale(1, lsy / lch).matrix;
    }
  }

  // get the reference point at the beginning in the local coordinate system
  private refPoint(ref: ResizeRef) {
    switch (ref) {
      case ResizeRef.CENTER:
        return { x: 0, y: 0 };
      case ResizeRef.TOP_LEFT:
        return { x: -0.5, y: 0.5 };
      case ResizeRef.TOP_RIGHT:
        return { x: 0.5, y: 0.5 };
      case ResizeRef.BOTTOM_LEFT:
        return { x: -0.5, y: -0.5 };
      case ResizeRef.BOTTOM_RIGHT:
        return { x: 0.5, y: -0.5 };
      case ResizeRef.TOP:
        return { x: 0, y: 0.5 };
      case ResizeRef.BOTTOM:
        return { x: 0, y: -0.5 };
      case ResizeRef.LEFT:
        return { x: -0.5, y: 0 };
      case ResizeRef.RIGHT:
        return { x: 0.5, y: 0 };
    }
  }

  // get the current size of the shape after transformation
  private currentSize() {
    const { x, y } = this.tm.apply({ x: 1, y: 1 });
    return { width: x, height: y };
  }
}
