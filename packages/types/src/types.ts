export type Optional<T> = T | null | undefined;
export type Predicate<A = any> = (args: A) => boolean;
export type With<A = any, B = any, C = any> = (a: A, b?: B, c?: C) => void;

export type Radian = number;
export type Degree = number;

export interface RawRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface RawPoint {
  x: number;
  y: number;
}

export interface BBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export interface BoundRect {
  left: number;
  right: number;
  top: number;
  bottom: number;
  x: number;
  y: number;
}

export interface Bound extends BBox, BoundRect {}

export type DomEventHandler<T = any> = (event: T) => any;

// export const TEST = 1;
