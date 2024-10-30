import { Affine } from "./Affine";
import { Line } from "./Line";
import { IPoint } from "./Point";
import { Transform } from "./Transform";
import { Radian, Scale } from "./types";
import {
  getPoint,
  Location,
  max,
  min,
  ResizeRatio,
  toLocation,
  TransformAnchor,
  TransformHandle,
} from "./utils";

// initial shape is a square with the center at (0, 0) and the side length is 2
export class Shaper {
  private readonly tm: Transform;

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

  affine() {
    return this.tm.matrix;
  }

  // dx, dy are the distance of the mouse move
  translate(dx: number, dy: number): Shaper {
    // remove scale -> remove rotate -> translate -> rotate -> rescale
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
    // remove scale -> rotate -> rescale
    const scaling = this.tm.matrix.scaling();
    const tm = this.tm
      .add(scaling.inverse())
      .rotate(angle, cx, cy)
      .add(scaling);
    return Shaper.from(tm);
  }

  // dx, dy are the distance of the mouse move
  resize(
    dx: Scale,
    dy: Scale,
    anchor: TransformAnchor,
    handle: TransformHandle,
    ratio: ResizeRatio,
  ): Shaper {
    const tm = this.tm;
    const ivm = tm.inverse();

    // calculate the scale factor in the initial coordinate system
    const anchorPoint = this.anchorPoint(anchor);
    const handlePoint = this.handlePoint(handle);
    const anchorLine = Line.fromPoints(anchorPoint, handlePoint);
    // initial size
    const before = anchorLine.vector();
    // final size after transformation
    const after = anchorLine
      .transform(tm.matrix)
      .moveEnd(dx, dy)
      .transform(ivm.matrix)
      .vector();

    // scale factor, some of them could be Infinity
    const scale = after.divide(before);
    // normalize the scale factor based on the anchor and handle
    const { sx: lsx, sy: lsy } = this.normalize(
      scale.x,
      scale.y,
      anchor,
      handle,
    );

    const { x: lax, y: lay } = anchorPoint;
    switch (ratio) {
      case ResizeRatio.FREE:
        return Shaper.from(this.tm.scale(lsx, lsy, lax, lay));
      case ResizeRatio.KEEP:
        const s = Math.max(lsx, lsy);
        return Shaper.from(this.tm.scale(s, s, lax, lay));
      case ResizeRatio.KEEP_X:
        return Shaper.from(this.tm.scale(lsx, 1, lax, lay));
      case ResizeRatio.KEEP_Y:
        return Shaper.from(this.tm.scale(1, lsy, lax, lay));
    }
  }

  private normalize(
    sx: number,
    sy: number,
    anchor: TransformAnchor,
    handle: TransformHandle,
  ) {
    if (handle === TransformHandle.CENTER) {
      switch (anchor) {
        case TransformAnchor.TOP_LEFT:
        case TransformAnchor.TOP_RIGHT:
        case TransformAnchor.BOTTOM_LEFT:
        case TransformAnchor.BOTTOM_RIGHT:
          return { sx, sy };
        case TransformAnchor.TOP:
        case TransformAnchor.BOTTOM:
          return { sx: 1, sy };
        case TransformAnchor.LEFT:
        case TransformAnchor.RIGHT:
          return { sx, sy: 1 };
      }
    }

    if (handle === TransformHandle.TOP || handle === TransformHandle.BOTTOM) {
      return { sx: 1, sy };
    }

    if (handle === TransformHandle.LEFT || handle === TransformHandle.RIGHT) {
      return { sx, sy: 1 };
    }

    if (sx === Infinity) {
      sx = 1;
    }

    if (sy === Infinity) {
      sy = 1;
    }

    return { sx, sy };
  }

  // get the reference point at the beginning in the local coordinate system
  private anchorPoint(anchor: TransformAnchor) {
    return getPoint(toLocation(anchor));
  }

  private handlePoint(handle: TransformHandle) {
    return getPoint(toLocation(handle));
  }

  flipX(): Shaper {
    return Shaper.from(this.tm.flipX());
  }

  flipY(): Shaper {
    return Shaper.from(this.tm.flipY());
  }

  // get the current size of the shape after transformation
  size() {
    const width = Line.fromPoints(
      getPoint(Location.LEFT),
      getPoint(Location.RIGHT),
    ).transform(this.tm.matrix).length;
    const height = Line.fromPoints(
      getPoint(Location.TOP),
      getPoint(Location.BOTTOM),
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

  toCSS() {
    return this.tm.matrix.toCSS();
  }

  // get the style for the shape
  // it is intended to be used in the style attribute of the element
  toStyle() {
    const { x, y } = this.center();
    const { width, height } = this.size();
    const angle = this.angle;
    // let transform = ``;
    // if (x || y) {
    //   if (!x) {
    //     transform += `translateY(${y}px)`;
    //   }
    //
    //   if (!y) {
    //     transform += `translateX(${x}px)`;
    //   }
    //
    //   if (x && y) {
    //     transform += `translate(${x}px, ${y}px)`;
    //   }
    // }
    //
    // if (angle) {
    //   transform += ` rotateZ(${angle}rad)`;
    // }

    return {
      left: `-${width / 2}px`,
      top: `-${height / 2}px`,
      width: `${width}px`,
      height: `${height}px`,
      transform: `translate(${x}px, ${y}px) rotateZ(${angle}rad)`,
    };
  }

  resizeTo(
    width: number,
    height: number,
    anchor: TransformAnchor,
    handle: TransformHandle,
  ) {
    const size = this.size();
    const sx = width / size.width;
    const sy = height / size.height;

    const { sx: nxs, sy: nsy } = this.normalize(sx, sy, anchor, handle);

    const { x: ax, y: ay } = getPoint(toLocation(anchor));

    console.log('resizeTo', sx, width, size.width, ax, ay);

    return Shaper.from(this.tm.scale(nxs, nsy, ax, ay));
  }

  boundRect() {
    const points: IPoint[] = [
      getPoint(Location.TOP_LEFT),
      getPoint(Location.TOP_RIGHT),
      getPoint(Location.BOTTOM_LEFT),
      getPoint(Location.BOTTOM_RIGHT),
    ];

    const globalPoints = points.map((p) => this.tm.apply(p));
    return {
      lx: min(...globalPoints.map((p) => p.x)),
      ly: min(...globalPoints.map((p) => p.y)),
      rx: max(...globalPoints.map((p) => p.x)),
      ry: max(...globalPoints.map((p) => p.y)),
    };
  }

  xAxis() {
    return this.tm.matrix.xAxis();
  }

  yAxis() {
    return this.tm.matrix.yAxis();
  }

  get angle() {
    return Line.UX.transform(this.tm.matrix).angle;
  }

  static is(shaper: any) {
    return shaper instanceof Shaper;
  }
}
