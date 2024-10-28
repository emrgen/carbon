import { expect, test } from "vitest";
import { Affine, Vector } from "../src/index";

test("find the current affine from a shape", () => {
  const af = Affine.fromSize(100, 100);
  expect(af.mat).toStrictEqual([50, 0, 0, 0, 50, 0]);
});

test("translate a point by 2, 3", () => {
  const af = Affine.translate(2, 3);
  const v = Vector.of(1, 0);
  const r = af.apply(v);
  expect(r.x).toBeCloseTo(3);
  expect(r.y).toBeCloseTo(3);
});

test("rotate a point by 45 degree", () => {
  const af = Affine.rotate(Math.PI / 4);
  const v = Vector.of(1, 0);
  const r = af.apply(v);
  expect(r.x).toBeCloseTo(0.707);
  expect(r.y).toBeCloseTo(0.707);
});

test("scale a point by 2", () => {
  const af = Affine.scale(2, 2);
  const v = Vector.of(1, 0);
  const r = af.apply(v);
  expect(r.x).toBeCloseTo(2);
  expect(r.y).toBeCloseTo(0);
});

test("chain transformations", () => {
  const af = Affine.scale(2, 2).rotate(Math.PI / 4);
  const v = Vector.of(1, 0);
  const r = af.apply(v);
  expect(r.x).toBeCloseTo(1.414);
  expect(r.y).toBeCloseTo(1.414);
});

test("rotate and translate", () => {
  const m = Affine.translate(2, 3).rotate(Math.PI / 4);
  console.log(m.toCSS());
  const v = Vector.of(1, 0);
  const p = m.apply(v);
  console.log(p);
  expect(p.x).toBeCloseTo(2.707);
  expect(p.y).toBeCloseTo(3.707);
});

test("inverse inverse", () => {
  const af = Affine.scale(2, 2);
  const inv = af.inverse().inverse();
  expect(af.toArray()).toStrictEqual(inv.toArray());

  const af2 = Affine.translate(2, 3);
  const inv2 = af2.inverse().inverse();
  expect(af2.toArray()).toStrictEqual(inv2.toArray());

  const af3 = Affine.rotate(Math.PI / 4);
  const inv3 = af3.inverse().inverse();
  expect(af3.toArray()).toStrictEqual(inv3.toArray());

  const af4 = Affine.translate(2, 3).rotate(Math.PI / 4);
  const inv4 = af4.inverse().inverse();
  expect(af4.toCSS()).toStrictEqual(inv4.toCSS());

  const af5 = Affine.translate(2, 3)
    .rotate(Math.PI / 4)
    .scale(2, 2);
  const inv5 = af5.inverse().inverse();
  expect(af5.toCSS()).toStrictEqual(inv5.toCSS());
});

test("inverse scale", () => {
  const af = Affine.scale(2, 2);
  const inv = af.inverse();
  const v = Vector.of(1, 0);
  const r = inv.apply(v);
  expect(r.x).toBeCloseTo(0.5);
  expect(r.y).toBeCloseTo(0);
});

test("inverse rotate", () => {
  const af = Affine.rotate(Math.PI / 4);
  const inv = af.inverse();
  const v = Vector.of(1, 0);
  const r = inv.apply(v);
  expect(r.x).toBeCloseTo(0.707);
  expect(r.y).toBeCloseTo(-0.707);
});

test("inverse translate", () => {
  const af = Affine.translate(2, 3);
  const inv = af.inverse();
  const v = Vector.of(1, 0);
  const r = inv.apply(v);
  expect(r.x).toBeCloseTo(-1);
  expect(r.y).toBeCloseTo(-3);
});

test("inverse rotation", () => {
  const af = Affine.rotate(Math.PI / 4);
  const inv = af.inverse();
  const v = Vector.of(1, 0);
  const iv = v.transform(af).transform(inv);
  expect(iv).toStrictEqual(v);
});

test("inverse scale", () => {
  const af = Affine.scale(2, 2);
  const inv = af.inverse();
  const v = Vector.of(1, 0);
  const iv = v.transform(af).transform(inv);
  expect(iv).toStrictEqual(v);
});

test("inverse a chain of transformation", () => {
  const af = Affine.translate(2, 3)
    .rotate(Math.PI / 4)
    .scale(2, 2);
  const inv = af.inverse();
  const v = Vector.of(1, 0);
  const iv = v.transform(af).transform(inv);
  expect(iv).toStrictEqual(v);
});

test("toCSS", () => {
  const af = Affine.scale(2, 2)
    .rotate(Math.PI / 4)
    .translate(2, 3);
  const css = af.toCSS();
  expect(css).toBe(
    "matrix(1.41421, 1.41421, -1.41421, 1.41421, -1.41421, 7.07107)",
  );
});

test("rotate a vector", () => {
  const m1 = Affine.rotate(Math.PI / 2);
  const v1 = Vector.of(1, 1);
  const p1 = v1.transform(m1);

  expect(p1.x).toBeCloseTo(-1);
  expect(p1.y).toBeCloseTo(1);
});