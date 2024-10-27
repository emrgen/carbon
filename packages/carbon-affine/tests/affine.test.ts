import { expect, test } from 'vitest';
import { Vector } from '../src/Vector';
import { Affine } from '../src/Affine';

test('translate a point by 2, 3', () => {
  const af = Affine.translate(2, 3)
  const v = Vector.of(1, 0)
  const r = af.apply(v)
  expect(r.x).toBeCloseTo(3)
  expect(r.y).toBeCloseTo(3)
})

test('rotate a point by 45 degree', () => {
  const af = Affine.rotate(Math.PI / 4)
  const v = Vector.of(1, 0)
  const r = af.apply(v)
  expect(r.x).toBeCloseTo(0.707)
  expect(r.y).toBeCloseTo(0.707)
})

test('scale a point by 2', () => {
  const af = Affine.scale(2, 2)
  const v = Vector.of(1, 0)
  const r = af.apply(v)
  expect(r.x).toBeCloseTo(2)
  expect(r.y).toBeCloseTo(0)
})

test('chain transformations', () => {
  const af = Affine.scale(2, 2).rotate(Math.PI / 4)
  const v = Vector.of(1, 0)
  const r = af.apply(v)
  expect(r.x).toBeCloseTo(1.414);
  expect(r.y).toBeCloseTo(1.414);
});

test('inverse scale', () => {
  const af = Affine.scale(2, 2)
  const inv = af.inverse()
  const v = Vector.of(1, 0)
  const r = inv.apply(v);
  expect(r.x).toBeCloseTo(0.5);
  expect(r.y).toBeCloseTo(0);
})

test('inverse rotate', () => {
  const af = Affine.rotate(Math.PI / 4)
  const inv = af.inverse()
  const v = Vector.of(1, 0)
  const r = inv.apply(v);
  expect(r.x).toBeCloseTo(0.707);
  expect(r.y).toBeCloseTo(-0.707);
})

test('inverse translate', () => {
  const af = Affine.translate(2, 3)
  const inv = af.inverse()
  const v = Vector.of(1, 0)
  const r = inv.apply(v);
  expect(r.x).toBeCloseTo(-1);
  expect(r.y).toBeCloseTo(-3);
})


test('rotate a vector', () => {
  const m1 = Affine.rotate(Math.PI / 2)
  const v1 = Vector.of(1, 1)
  const p1 = v1.transform(m1)

  expect(p1.x).toBeCloseTo(-1)
  expect(p1.y).toBeCloseTo(1)
});

test('toCSS', () => {
  const af = Affine.scale(2, 2).rotate(Math.PI / 4).translate(2, 3);
  const css = af.toCSS()
  expect(css).toBe('matrix(1.41421, 1.41421, -1.41421, 1.41421, -1.41421, 7.07107)')
})
