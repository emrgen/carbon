import { Affine } from "./Affine";
import { Line } from "./Line";
import { Transform } from "./Transform";
import { Radian } from "./types";
import { Vector } from "./Vector";

export enum Anchor {
  CENTER = "anchor-center",
  TOP_LEFT = "anchor-top-left",
  TOP_RIGHT = "anchor-top-right",
  BOTTOM_LEFT = "anchor-bottom-left",
  BOTTOM_RIGHT = "anchor-bottom-right",
  TOP = "anchor-top",
  BOTTOM = "anchor-bottom",
  LEFT = "anchor-left",
  RIGHT = "anchor-right",
}

export enum Handle {
  TOP_LEFT = "handle-top-left",
  TOP_RIGHT = "handle-top-right",
  BOTTOM_LEFT = "handle-bottom-left",
  BOTTOM_RIGHT = "handle-bottom-right",
  TOP = "handle-top",
  BOTTOM = "handle-bottom",
  LEFT = "handle-left",
  RIGHT = "handle-right",
}

function isHandle(anchor: Anchor | Handle): anchor is Handle {
  return anchor.includes("handle");
}

export function isAnchor(anchor: Anchor | Handle): anchor is Anchor {
  return !isHandle(anchor);
}

export function toAnchor(handle: Handle | Anchor): Anchor {
  if (isAnchor(handle)) {
    return handle;
  }
  return handle.replace("handle", "anchor") as Anchor;
}

export enum ResizeRatio {
  FREE = "free",
  KEEP = "keep",
  KEEP_X = "keep-x",
  KEEP_Y = "keep-y",
}

// initial shape is a square with the center at (0, 0) and the side length is 2
export class Shaper {
  private tm: Transform;

  static IDENTITY = Shaper.from(Transform.from(Affine.IDENTITY));

  static default() {
    return Shaper.from(Transform.from(Affine.IDENTITY));
  }

  static fromCSS(css: string) {
    return this.from(Transform.from(Affine.fromCSS(css)));
  }

  static from(tm: Transform | Affine) {
    return new Shaper(tm)
  }

  constructor(tm: Transform | Affine) {
    if (tm instanceof Transform) {
      this.tm = tm;
    } else {
      this.tm = Transform.from(tm);
    }
  }

  into() {
    return this.tm;
  }

  translate(dx: number, dy: number): Affine {
    return this.tm.translate(dx, dy).matrix;
  }

  rotate(angle: Radian, cx?: number, cy?: number): Affine {
    return this.tm.rotate(angle, cx, cy).matrix;
  }

  // dx, dy are the distance of the mouse move
  resize(dx: number, dy: number, ref: Anchor | Handle, ratio: ResizeRatio): Affine {
    const anchor = toAnchor(ref);

    // get the reference point in the current coordinate system
    const { x: lcx, y: lcy } = this.refPoint(anchor);
    let lw = 2;
    let lh = 2;
    // get the current size and resize amount in local coordinate system
    let { x: ldsx, y: ldsy } = this.tm.matrix.inverse().apply({ x: dx, y: dy });

    switch (anchor) {
      case Anchor.CENTER:
        lw *= 0.5
        lh *= 0.5
        break;
      case Anchor.LEFT:
        ldsy = 0
        break;
      case Anchor.RIGHT:
        ldsy = 0
        ldsx *= -1
        break;
      case Anchor.TOP:
        ldsx = 0
        break;
      case Anchor.BOTTOM:
        ldsx = 0
        ldsy *= -1
        break;
      case Anchor.TOP_RIGHT:
        ldsx *= -1
        break;
      case Anchor.BOTTOM_LEFT:
        ldsy *= -1
        break;
      case Anchor.BOTTOM_RIGHT:
        ldsx *= -1
        ldsy *= -1
        break;
    }

    const lsx = ldsx + lw;
    const lsy = ldsy + lh;
    console.log('scales',ldsx, ldsy, lsx, lsy);
    console.log(lw,lsx , lsx / lw, lcx)
    // console.log(lh,lsy , lsy / lh, lcy)

    switch (ratio) {
      case ResizeRatio.FREE:
        return this.tm.scale(lsx / lw, lsy / lh, lcx, lcy).matrix;
      case ResizeRatio.KEEP:
        const s = Math.max(lsx / lw, lsy / lh, lcx, lcy);
        return this.tm.scale(s, s, lcx, lcy).matrix;
      case ResizeRatio.KEEP_X:
        return this.tm.scale(lsx / lw, 1, lcx, lcy).matrix;
      case ResizeRatio.KEEP_Y:
        return this.tm.scale(1, lsy / lh, lcx, lcy).matrix;
    }

    return this.tm.matrix;
  }

  // get the reference point at the beginning in the local coordinate system
  private refPoint(ref: Anchor) {
    switch (ref) {
      case Anchor.CENTER:
        return { x: 0, y: 0 };
      case Anchor.TOP_LEFT:
        return { x: -1, y: -1 };
      case Anchor.TOP_RIGHT:
        return { x: 1, y: -1 };
      case Anchor.BOTTOM_LEFT:
        return { x: -1, y: 1 };
      case Anchor.BOTTOM_RIGHT:
        return { x: 1, y: 1 };
      case Anchor.TOP:
        return { x: 0, y: -1 };
      case Anchor.BOTTOM:
        return { x: 0, y: 1 };
      case Anchor.LEFT:
        return { x: -1, y: 0 };
      case Anchor.RIGHT:
        return { x: 1, y: 0 };
    }
  }

  // get the current size of the shape after transformation
  size() {
    const { x, y } = this.tm.apply({ x: 2, y: 2 });
    return { width: x, height: y };
  }
}
