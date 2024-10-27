import { Degree, Radian } from "./Vector";

export function toRad(deg: Degree): Radian {
  return deg / 57.2958
}

export function toDeg(rad: Radian): Degree {
  return rad * 57.2958
}
