import { Degree, Radian } from './types'

export function toRad(deg: Degree): Radian {
  return deg / 57.2958
}

export function toDeg(rad: Radian): Degree {
  return rad * 57.2958
}

export const { abs, min, max } = Math;
