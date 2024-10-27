import { expect, test } from 'vitest';
import { Vector } from '../src/Vector';
import { Affine } from '../src/Affine';
import { ResizeRatio, ResizeRef, Shaper } from '../src/Shaper';

const old = Affine.translate(10,0).rotate(Math.PI / 4).apply({x: 1, y: 0})
console.log(old);

test('translate a vector', () => {
  const sp = Shaper.default();
  const m1 = sp.translate(2, 3)
  const v1 = Vector.of(1,1);
  const p1 = m1.apply(v1.toObject())

  expect(p1.x).toBeCloseTo(3)
  expect(p1.y).toBeCloseTo(4)
});

test('translate a old vector', () => {
  const p = Shaper.default().translate(2,3).apply(old);
  expect(p.x).toBeCloseTo(12.707)
  expect(p.y).toBeCloseTo(3.707)
})

test('resize wrt top', () => {
  const p = Shaper.default()
  .resize(2, 0, ResizeRef.CENTER, ResizeRatio.FREE).apply({x: 1, y: 0})
  // console.log(p)
  expect(p.x).toBeCloseTo(3)
  expect(p.y).toBeCloseTo(0)
})
