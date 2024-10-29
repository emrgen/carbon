import { Degree, Radian } from "./types";

export function toRad(deg: Degree): Radian {
  return deg / 57.2958;
}

export function toDeg(rad: Radian): Degree {
  return rad * 57.2958;
}

export function considerZero(num: number): number {
  return Math.abs(num) < 1e-10 ? 0 : num;
}

export const { abs, min, max } = Math;

function isHandle(
  anchor: TransformAnchor | TransformHandle,
): anchor is TransformHandle {
  return anchor.includes("handle");
}

export function isAnchor(
  anchor: TransformAnchor | TransformHandle,
): anchor is TransformAnchor {
  return !isHandle(anchor);
}

export function toAnchor(
  handle: TransformHandle | TransformAnchor,
): TransformAnchor {
  if (isAnchor(handle)) {
    return handle;
  }
  return handle.replace("handle", "anchor") as TransformAnchor;
}

export function toHandle(
  anchor: TransformHandle | TransformAnchor,
): TransformHandle {
  if (isHandle(anchor)) {
    return anchor;
  }
  return anchor.replace("anchor", "handle") as TransformHandle;
}

export function toLocation(
  anchor: TransformAnchor | TransformHandle,
): Location {
  if (isAnchor(anchor)) {
    return anchor.replace("anchor-", "") as Location;
  }
  if (isHandle(anchor)) {
    return anchor.replace("handle-", "") as Location;
  }

  return anchor as Location;
}

export enum ResizeRatio {
  FREE = "free",
  KEEP = "keep",
  KEEP_X = "keep-x",
  KEEP_Y = "keep-y",
}

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

export enum TransformAnchor {
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

export enum TransformHandle {
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

const LEFT = -1;
const RIGHT = 1;
const TOP = -1;
const BOTTOM = 1;

export function getPoint(location: Location) {
  switch (location) {
    case Location.CENTER:
      return { x: 0, y: 0 };
    case Location.TOP_LEFT:
      return { x: LEFT, y: TOP };
    case Location.TOP_RIGHT:
      return { x: RIGHT, y: TOP };
    case Location.BOTTOM_LEFT:
      return { x: LEFT, y: BOTTOM };
    case Location.BOTTOM_RIGHT:
      return { x: RIGHT, y: BOTTOM };
    case Location.TOP:
      return { x: 0, y: TOP };
    case Location.BOTTOM:
      return { x: 0, y: BOTTOM };
    case Location.LEFT:
      return { x: LEFT, y: 0 };
    case Location.RIGHT:
      return { x: RIGHT, y: 0 };
  }
}