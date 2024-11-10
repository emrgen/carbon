import { BBox, Bound, NodeRect, RawPoint } from "@emrgen/types";
import { MouseEvent } from "react";
import { DndEvent } from "../types";

const { min, max, abs } = Math;

export const domRect = (el: HTMLElement) => el.getBoundingClientRect();

export const getEventPosition = <E extends MouseEvent>(from: E, to: E) => {
  const { clientX: startX, clientY: startY } = from;
  const { clientX: endX, clientY: endY } = to;
  return {
    startX,
    startY,
    endX,
    endY,
    deltaX: endX - startX,
    deltaY: endY - startY,
  };
};

// sort bounds by top, then left
export function boundSorter(a: Bound, b: Bound) {
  return a.top - b.top || a.left - b.left;
}

// find the bound of an element
export function elementBound(
  el: HTMLElement,
  adjust = { left: 0, top: 0 },
): Bound {
  let { left, right, top, bottom } = el.getBoundingClientRect();

  left += adjust.left;
  right += adjust.left;
  top += adjust.top;
  bottom += adjust.top;

  return {
    left,
    right,
    top,
    bottom,
    maxX: right,
    minX: left,
    minY: top,
    maxY: bottom,
    x: (left + right) / 2,
    y: (top + bottom) / 2,
  };
}

export function domRectToBound(rect: DOMRect): Bound {
  const { left, right, top, bottom } = rect;
  return {
    left,
    right,
    top,
    bottom,
    maxX: right,
    minX: left,
    minY: top,
    maxY: bottom,
    x: (left + right) / 2,
    y: (top + bottom) / 2,
  };
}

// find the bound of two points
export const boundFromPoints = (p1: RawPoint, p2: RawPoint) => {
  const { x: sx, y: sy } = p1;
  const { x: ex, y: ey } = p2;

  return {
    left: min(sx, ex),
    top: min(sy, ey),
    width: abs(sx - ex),
    height: abs(sy - ey),
  };
};

export const DefaultBound = {
  left: 0,
  top: 0,
  width: 0,
  height: 0,
};

// find box from two points
export const boxFromPoints = (p1: RawPoint, p2: RawPoint): BBox => {
  const { x: sx, y: sy } = p1;
  const { x: ex, y: ey } = p2;

  return {
    minX: min(sx, ex),
    minY: min(sy, ey),
    maxX: max(sx, ex),
    maxY: max(sy, ey),
  };
};

export const boxFromNodeRect = (box: NodeRect): BBox => {
  return {
    minX: min(box.x1, box.x2),
    minY: min(box.y1, box.y2),
    maxX: max(box.x1, box.x2),
    maxY: max(box.y1, box.y2),
  };
};

// find box from dnd event
export const boundFromFastDndEvent = (event: Pick<DndEvent, "position">) => {
  const { sp, ep } = pointsFromFastDndEvent(event);
  return boxFromPoints(sp, ep);
};

// find points from dnd event
export const pointsFromFastDndEvent = (event: Pick<DndEvent, "position">) => {
  const { startX, startY, endX, endY } = event.position;
  return {
    sp: { x: startX, y: startY },
    ep: { x: endX, y: endY },
  };
};

export const adjustBox = (box: BBox, adjust = { left: 0, top: 0 }): BBox => {
  const { minX, minY, maxX, maxY } = box;
  return {
    minX: minX + adjust.left,
    minY: minY + adjust.top,
    maxX: maxX + adjust.left,
    maxY: maxY + adjust.top,
  };
};

export const boundFromBounds = (bounds: Bound[]): Bound => {
  const left = min(...bounds.map((b) => b.left));
  const top = min(...bounds.map((b) => b.top));
  const right = max(...bounds.map((b) => b.right));
  const bottom = max(...bounds.map((b) => b.bottom));

  return {
    left,
    top,
    right,
    bottom,
    maxX: right,
    minX: left,
    minY: top,
    maxY: bottom,
    x: (left + right) / 2,
    y: (top + bottom) / 2,
  };
};
