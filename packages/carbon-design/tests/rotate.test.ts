import {applyToPoint, compose, rotateDEG, translate,} from "transformation-matrix";
import {expect, test} from "vitest";

test("rotate by 45 degree", () => {
  const point = applyToPoint(rotateDEG(45), { x: 40, y: 30 });
  expect(point.x).toBeCloseTo(7.0, 0.1);
  expect(point.y).toBeCloseTo(49.49, 0.1);
});

test("translate by 20 unit", () => {
  const mat = compose(translate(20, 0));
  const point = applyToPoint(mat, { x: 40, y: 30 });

  expect(point.x).toBeCloseTo(60, 0);
  expect(point.y).toBeCloseTo(30.0, 0.1);
});

test("rotate and translate", () => {
  const mat = compose(translate(20, 0), rotateDEG(45));
  const point = applyToPoint(mat, { x: 40, y: 30 });
  expect(point.x).toBeCloseTo(27, 0);
  expect(point.y).toBeCloseTo(49.49, 0.1);
});

test("rotated and translated state to rotate", () => {
  const mat = compose(translate(20, 0), rotateDEG(45));
  const point = applyToPoint(mat, { x: 50, y: 50 });

  const mat1 = rotateDEG(-90);
  const point1 = applyToPoint(mat1, point);

  console.log(point1);

  // expect(point1.x).toBeCloseTo(70, 3);
  // expect(point1.y).toBeCloseTo(-20, 3);

  // rotate by 45 degree
});