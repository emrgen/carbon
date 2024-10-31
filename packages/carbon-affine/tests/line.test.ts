import { expect, test } from "vitest";
import { Line } from "../src/index";

test("test line extend start", () => {
  const line = new Line({ x: 0, y: 0 }, { x: 10, y: 10 });
  const extended = line.extendStart(10);
  expect(extended.start.x).toBeCloseTo(-7.0710678118654755);
  expect(extended.start.y).toBeCloseTo(-7.0710678118654755);
  expect(extended.end).toEqual({ x: 10, y: 10 });
});

test("test line extend end", () => {
  const line = new Line({ x: 0, y: 0 }, { x: 10, y: 10 });
  const extended = line.extendEnd(10);
  expect(extended.start).toEqual({ x: 0, y: 0 });
  expect(extended.end.x).toBeCloseTo(17.071067811865476);
  expect(extended.end.y).toBeCloseTo(17.071067811865476);
});