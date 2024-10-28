import { Affine } from "./Affine";
import { Line } from "./Line";
import { IPoint } from "./Point";
import { Transform } from "./Transform";
import { Radian } from "./types";

export enum Location {
  CENTER = "center",
  TOP = "top",
  BOTTOM = "bottom",
  LEFT = "left",
  RIGHT = "right",
  TOP_LEFT = "top-left",
  TOP_RIGHT = "top-right",
  BOTTOM_LEFT = "bottom-left",
  BOTTOM_RIGHT = "bottom-right",
}

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
  CENTER = "handle-center",
  TOP_LEFT = "handle-top-left",
  TOP_RIGHT = "handle-top-right",
  BOTTOM_LEFT = "handle-bottom-left",
  BOTTOM_RIGHT = "handle-bottom-right",
  TOP = "handle-top",
  BOTTOM = "handle-bottom",
  LEFT = "handle-left",
  RIGHT = "handle-right",
}

function toLocation(anchor: Anchor | Handle): Location {
  return isAnchor(anchor)
    ? (anchor.replace("anchor-", "") as Location)
    : (anchor.replace("handle-", "") as Location);
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

export function toHandle(anchor: Handle | Anchor): Handle {
  if (isHandle(anchor)) {
    return anchor;
  }
  return anchor.replace("anchor", "handle") as Handle;
}

export enum ResizeRatio {
  FREE = "free",
  KEEP = "keep",
  KEEP_X = "keep-x",
  KEEP_Y = "keep-y",
}

const DEFAULT_SIZE = 2;

// initial shape is a square with the center at (0, 0) and the side length is 2
export class Shaper {
  private readonly tm: Transform;

  static LEFT = -DEFAULT_SIZE / 2;
  static RIGHT = DEFAULT_SIZE / 2;
  static TOP = -DEFAULT_SIZE / 2;
  static BOTTOM = DEFAULT_SIZE / 2;

  static IDENTITY = Shaper.from(Transform.from(Affine.IDENTITY));

  static default() {
    return Shaper.from(Transform.from(Affine.IDENTITY));
  }

  static fromCSS(css: string) {
    return this.from(Transform.from(Affine.fromCSS(css)));
  }

  static from(tm: Transform | Affine) {
    return new Shaper(tm);
  }

  constructor(tm: Transform | Affine) {
    if (tm instanceof Transform) {
      this.tm = tm;
    } else {
      this.tm = Transform.from(tm);
    }
  }

  into() {
    return this.tm.matrix;
  }

  // dx, dy are the distance of the mouse move
  translate(dx: number, dy: number): Shaper {
    // restore the rotation -> translate -> rotate again
    const af = this.tm.matrix;
    const { rotation, scaling } = af.decompose();
    const mat = af
      .mul(scaling.inverse())
      .mul(rotation.inverse())
      .translate(dx, dy)
      .mul(rotation)
      .mul(scaling);

    return Shaper.from(Transform.from(mat));
  }

  rotate(angle: Radian, cx?: number, cy?: number): Shaper {
    // inverse -> rotate -> restore
    const scaling = this.tm.matrix.scaling();
    const tm = this.tm
      .add(scaling.inverse())
      .rotate(angle, cx, cy)
      .add(scaling);
    return Shaper.from(tm);
  }

  // dx, dy are the distance of the mouse move
  resize(
    dx: number,
    dy: number,
    anchor: Anchor,
    handle: Handle,
    ratio: ResizeRatio,
  ): Shaper {
    const af = this.tm.matrix;
    const rotation = af.rotation();
    const base = af.mul(rotation.inverse());

    const tm = this.tm;
    const ivm = tm.inverse();

    // calculate the scale factor in the initial coordinate system
    const anchorPoint = this.anchorPoint(anchor);
    const handlePoint = this.handlePoint(handle);
    const anchorLine = Line.fromPoints(anchorPoint, handlePoint);
    // initial size
    const before = anchorLine.vector();
    // final size after transformation

    // console.log("anchorLine", anchorLine);
    // console.log(anchorLine.transform(tm.matrix));
    // console.log(anchorLine.transform(tm.matrix).moveEnd(dx, dy));
    // console.log(
    //   anchorLine.transform(tm.matrix).moveEnd(dx, dy).transform(ivm.matrix),
    // );

    const after = anchorLine
      .transform(tm.matrix)
      .moveEnd(dx, dy)
      .transform(ivm.matrix)
      .vector();

    // scale factor
    const scale = after.divide(before);
    // console.log(scale);
    // normalize the scale factor based on the anchor and handle
    const { sx: lsx, sy: lsy } = this.normalizeScales(
      scale.x,
      scale.y,
      anchor,
      handle,
    );

    // console.log("scales", lsx, lsy);

    const { x: lax, y: lay } = anchorPoint;
    switch (ratio) {
      case ResizeRatio.FREE:
        return Shaper.from(this.tm.scale(lsx, lsy, lax, lay));
      case ResizeRatio.KEEP:
        const s = Math.max(lsx, lsy, lax, lay);
        return Shaper.from(this.tm.scale(s, s, lax, lay));
      case ResizeRatio.KEEP_X:
        return Shaper.from(this.tm.scale(lsx, 1, lax, lay));
      case ResizeRatio.KEEP_Y:
        return Shaper.from(this.tm.scale(1, lsy, lax, lay));
    }
  }

  private normalizeScales(
    sx: number,
    sy: number,
    anchor: Anchor,
    handle: Handle,
  ) {
    if (handle === Handle.CENTER) {
      switch (anchor) {
        case Anchor.TOP_LEFT:
        case Anchor.TOP_RIGHT:
        case Anchor.BOTTOM_LEFT:
        case Anchor.BOTTOM_RIGHT:
          return { sx, sy };
        case Anchor.TOP:
        case Anchor.BOTTOM:
          return { sx: 1, sy };
        case Anchor.LEFT:
        case Anchor.RIGHT:
          return { sx, sy: 1 };
      }
    }

    if (handle === Handle.TOP || handle === Handle.BOTTOM) {
      return { sx: 1, sy };
    }

    if (handle === Handle.LEFT || handle === Handle.RIGHT) {
      return { sx, sy: 1 };
    }

    return { sx, sy };
  }

  // get the reference point at the beginning in the local coordinate system
  private anchorPoint(anchor: Anchor) {
    return this.pointAt(toLocation(anchor));
  }

  private handlePoint(handle: Handle) {
    return this.pointAt(toLocation(handle));
  }

  private pointAt(location: Location) {
    switch (location) {
      case Location.CENTER:
        return { x: 0, y: 0 };
      case Location.TOP_LEFT:
        return { x: Shaper.LEFT, y: Shaper.TOP };
      case Location.TOP_RIGHT:
        return { x: Shaper.RIGHT, y: Shaper.TOP };
      case Location.BOTTOM_LEFT:
        return { x: Shaper.LEFT, y: Shaper.BOTTOM };
      case Location.BOTTOM_RIGHT:
        return { x: Shaper.RIGHT, y: Shaper.BOTTOM };
      case Location.TOP:
        return { x: 0, y: Shaper.TOP };
      case Location.BOTTOM:
        return { x: 0, y: Shaper.BOTTOM };
      case Location.LEFT:
        return { x: Shaper.LEFT, y: 0 };
      case Location.RIGHT:
        return { x: Shaper.RIGHT, y: 0 };
    }
  }

  toHandle(anchor: Anchor) {
    if (anchor === Anchor.CENTER) {
      throw new Error("Cannot convert center anchor to handle");
    }

    return toHandle(anchor);
  }

  toAnchor(handle: Handle) {
    if (handle === Handle.CENTER) {
      throw new Error("Cannot convert center handle to anchor");
    }
    return toAnchor(handle);
  }

  // get the current size of the shape after transformation
  size() {
    const width = Line.fromPoints(
      this.pointAt(Location.LEFT),
      this.pointAt(Location.RIGHT),
    ).transform(this.tm.matrix).length;
    const height = Line.fromPoints(
      this.pointAt(Location.TOP),
      this.pointAt(Location.BOTTOM),
    ).transform(this.tm.matrix).length;
    return {
      width,
      height,
    };
  }

  apply<T extends IPoint | IPoint[]>(v: T): T {
    return this.tm.apply(v);
  }

  center() {
    return this.tm.apply({ x: 0, y: 0 });
  }
}
