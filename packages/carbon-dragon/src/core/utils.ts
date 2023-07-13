import { Bound, RawPoint } from '@emrgen/types';
import { DndEvent } from '../types';

const { min, max, abs } = Math;

// sort bounds by top, then left
export function boundSorter(a: Bound, b: Bound) {
  return a.top - b.top || a.left - b.left;
}

// find the bound of an element
export function elementBound(el: HTMLElement): Bound {
  const { left, right, top, bottom } = el.getBoundingClientRect();
  return {
    left, right, top, bottom,
    maxX: right,
    minX: left,
    minY: top,
    maxY: bottom,
    x: (left + right) / 2,
    y: (top + bottom) / 2,
  }
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
  }
}

export const DefaultBound = {
  left: 0,
  top: 0,
  width: 0,
  height: 0,
}

// find box from two points
export const boxFromPoints = (p1: RawPoint, p2: RawPoint) => {
  const { x: sx, y: sy } = p1;
  const { x: ex, y: ey } = p2;

  return {
    minX: min(sx, ex),
    minY: min(sy, ey),
    maxX: max(sx, ex),
    maxY: max(sy, ey),
  }
}

// find box from dnd event
export const boundFromFastDndEvent = (event: DndEvent) => {
  const {sp, ep} = pointsFromFastDndEvent(event)
  return boxFromPoints(sp, ep)
}

// find points from dnd event
export const pointsFromFastDndEvent = (event: DndEvent) => {
  const {startX, startY, endX, endY} = event.position
  return {
    sp: { x: startX, y: startY },
    ep: { x: endX, y: endY },
  }
}
