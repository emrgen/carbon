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
