import { expect, test } from "vitest";
import { Vector } from "../src/Vector";

test("create a unit vector", () => {
  const v = Vector.of(1, 0);
  expect(v.norm().toArray()).toEqual([1, 0]);
});

test("rotate a vector", () => {
  const v = Vector.of(1, 0);
  const r = v.rotate(Math.PI / 2);
  expect(r.x).toBeCloseTo(0);
  expect(r.y).toBeCloseTo(1);
});

test("invert a vector", () => {
  const v = Vector.of(1, 0);
  const r = v.invert();
  expect(r.x).toBeCloseTo(-1);
  expect(r.y).toBeCloseTo(0);
});

test("add two vectors", () => {
  const v1 = Vector.of(1, 0);
  const v2 = Vector.of(0, 1);
  const r = v1.add(v2);
  expect(r.x).toBeCloseTo(1);
  expect(r.y).toBeCloseTo(1);
});

test("subtract two vectors", () => {
  const v1 = Vector.of(1, 0);
  const v2 = Vector.of(0, 1);
  const r = v1.sub(v2);
  expect(r.x).toBeCloseTo(1);
  expect(r.y).toBeCloseTo(-1);
});

test("dot product of two vectors", () => {
  const v1 = Vector.of(1, 0);
  const v2 = Vector.of(0, 1);
  const r = v1.dot(v2);
  expect(r).toBeCloseTo(0);
});

test("angle between two vectors", () => {
  const v1 = Vector.of(1, 0);
  const v2 = Vector.of(0, 1);
  const r = v1.angleBetween(v2);
  expect(r).toBeCloseTo(Math.PI / 2);
});

test("scale a vector", () => {
  const v = Vector.of(1, 0);
  const r = v.scale(2);
  expect(r.x).toBeCloseTo(2);
  expect(r.y).toBeCloseTo(0);
});

test("normalize a vector", () => {
  const v = Vector.of(3, 4);
  const r = v.norm();
  expect(r.x).toBeCloseTo(3 / 5);
  expect(r.y).toBeCloseTo(4 / 5);
});

test("project a vector", () => {
  const v = Vector.of(3, 4);
  const r = v.project(Vector.of(1, 1));
  expect(r.x).toBeCloseTo(3.5);
  expect(r.y).toBeCloseTo(3.5);
});

test("get the size of a vector", () => {
  const v = Vector.of(3, 4);
  const r = v.size();
  expect(r).toBeCloseTo(5);
});

test("get the rotation of a vector", () => {
  const v = Vector.of(1, 1);
  const r = v.angle;
  expect(r).toBeCloseTo(Math.PI / 4);
});

test("get the vector from an angle", () => {
  const v = Vector.fromAngle(Math.PI / 4);
  expect(v.x).toBeCloseTo(1 / Math.sqrt(2));
  expect(v.y).toBeCloseTo(1 / Math.sqrt(2));
});

test("get the vector from an array", () => {
  const v = Vector.fromArray([1, 2]);
  expect(v.x).toBeCloseTo(1);
  expect(v.y).toBeCloseTo(2);
});

test("get the vector from an object", () => {
  const v = Vector.fromObject({ x: 1, y: 2 });
  expect(v.x).toBeCloseTo(1);
  expect(v.y).toBeCloseTo(2);
});
