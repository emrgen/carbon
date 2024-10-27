import { expect, test } from 'vitest';
import { Vector } from '../src/Vector';
import { Affine } from '../src/Affine';
import { ResizeRatio, Anchor, Shaper } from '../src/Shaper';
import { Transform } from '../src/Transform';

const old = Affine.translate(10, 0).rotate(Math.PI / 4).apply({ x: 1, y: 0 })
const sp = Shaper.default();

test('translate a vector', () => {
  const m1 = sp.translate(2, 3)
  const v1 = Vector.of(1, 1);
  const p1 = m1.apply(v1.toObject())

  expect(p1.x).toBeCloseTo(3)
  expect(p1.y).toBeCloseTo(4)
});

test('translate a old vector', () => {
  const p = Shaper.default().translate(2, 3).apply(old);
  expect(p.x).toBeCloseTo(12.707)
  expect(p.y).toBeCloseTo(3.707)
})

test('resize at zero wrt ref', () => {
  {
    const p1 = sp
      .resize(2, 2, Anchor.CENTER, ResizeRatio.FREE)
      .apply({ x: 1, y: 1 })
    expect(p1.x).toBeCloseTo(3)
    expect(p1.y).toBeCloseTo(3)
  }

  {
    // resize wrt left should not change the x coordinate of left side
    const m = sp.resize(2, 2, Anchor.LEFT, ResizeRatio.FREE)
    const p2 = m.apply({ x: 1, y: 1 })
    expect(p2.x).toBeCloseTo(3)
    expect(p2.y).toBeCloseTo(1)
    const p3 = m.apply({ x: -1, y: 0 })
    expect(p3.x).toBeCloseTo(-1)
  }

  {
    // resize wrt right should not change the x coordinate of right side
    const m = sp.resize(-2, 2, Anchor.RIGHT, ResizeRatio.FREE)
    const p2 = m.apply({ x: -1, y: 1 })
    expect(p2.x).toBeCloseTo(-3)
    expect(p2.y).toBeCloseTo(1)
    const p3 = m.apply({ x: 1, y: 0 })
    expect(p3.x).toBeCloseTo(1)
  }

  {
    // resize wrt top should not change the y coordinate of top side
    const m = sp.resize(2, 2, Anchor.TOP, ResizeRatio.FREE)
    const p2 = m.apply({ x: 1, y: 1 })
    expect(p2.x).toBeCloseTo(1)
    expect(p2.y).toBeCloseTo(3)
    const p3 = m.apply({ x: 0, y: -1 })
    expect(p3.y).toBeCloseTo(-1)
  }

  {
    // resize wrt bottom should not change the y coordinate of bottom side
    const m = sp.resize(2, -2, Anchor.BOTTOM, ResizeRatio.FREE)
    const p1 = m.apply({ x: 1, y: -1 })
    expect(p1.x).toBeCloseTo(1)
    expect(p1.y).toBeCloseTo(-3)
    const p2 = m.apply({ x: 0, y: 1 })
    expect(p2.y).toBeCloseTo(1)
  }

  {
    // resize wrt top-left should not change the x coordinate of left side and y coordinate of top side
    const m = sp.resize(2, 2, Anchor.TOP_LEFT, ResizeRatio.FREE);
    const p1 = m.apply({ x: 1, y: 1 });
    expect(p1.x).toBeCloseTo(3);
    expect(p1.y).toBeCloseTo(3);
    const p2 = m.apply({ x: -1, y: -1 });
    expect(p2.x).toBeCloseTo(-1);
    expect(p2.y).toBeCloseTo(-1);
    const p3 = m.apply({ x: 1, y: -1 });
    expect(p3.x).toBeCloseTo(3);
    expect(p3.y).toBeCloseTo(-1);
    const p4 = m.apply({ x: -1, y: 1 });
    expect(p4.x).toBeCloseTo(-1);
    expect(p4.y).toBeCloseTo(3);
  }

  {
    // resize wrt top-right should not change the x coordinate of right side and y coordinate of top side
    const m = sp.resize(-2, 2, Anchor.TOP_RIGHT, ResizeRatio.FREE);
    const p1 = m.apply({ x: -1, y: 1 });
    expect(p1.x).toBeCloseTo(-3);
    expect(p1.y).toBeCloseTo(3);
    const p2 = m.apply({ x: 1, y: -1 });
    expect(p2.x).toBeCloseTo(1);
    expect(p2.y).toBeCloseTo(-1);
    const p3 = m.apply({ x: -1, y: -1 });
    expect(p3.x).toBeCloseTo(-3);
    expect(p3.y).toBeCloseTo(-1);
    const p4 = m.apply({ x: 1, y: 1 });
    expect(p4.x).toBeCloseTo(1);
    expect(p4.y).toBeCloseTo(3);
  }

  {
    // resize wrt bottom-left should not change the x coordinate of left side and y coordinate of bottom side
    const m = sp.resize(2, -2, Anchor.BOTTOM_LEFT, ResizeRatio.FREE);
    const p1 = m.apply({ x: 1, y: -1 });
    expect(p1.x).toBeCloseTo(3);
    expect(p1.y).toBeCloseTo(-3);
    const p2 = m.apply({ x: -1, y: 1 });
    expect(p2.x).toBeCloseTo(-1);
    expect(p2.y).toBeCloseTo(1);
    const p3 = m.apply({ x: 1, y: 1 });
    expect(p3.x).toBeCloseTo(3);
    expect(p3.y).toBeCloseTo(1);
    const p4 = m.apply({ x: -1, y: -1 });
    expect(p4.x).toBeCloseTo(-1);
    expect(p4.y).toBeCloseTo(-3);
  }

  {
    // resize wrt bottom-right should not change the x coordinate of right side and y coordinate of bottom side
    const m = sp.resize(-2, -2, Anchor.BOTTOM_RIGHT, ResizeRatio.FREE);
    const p1 = m.apply({ x: -1, y: -1 });
    expect(p1.x).toBeCloseTo(-3);
    expect(p1.y).toBeCloseTo(-3);
    const p2 = m.apply({ x: 1, y: 1 });
    expect(p2.x).toBeCloseTo(1);
    expect(p2.y).toBeCloseTo(1);
    const p3 = m.apply({ x: -1, y: 1 });
    expect(p3.x).toBeCloseTo(-3);
    expect(p3.y).toBeCloseTo(1);
    const p4 = m.apply({ x: 1, y: -1 });
    expect(p4.x).toBeCloseTo(1);
    expect(p4.y).toBeCloseTo(-3);
  }
});

test('translate and resize', () => {
  const m = Shaper.from(Affine.translate(3, 4)).resize(2, 2, Anchor.CENTER, ResizeRatio.FREE)
  const p1 = m.apply({ x: 1, y: 1 })
  expect(p1.x).toBeCloseTo(6)
  expect(p1.y).toBeCloseTo(7)
  const p2 = m.apply({ x: -1, y: -1 })
  expect(p2.x).toBeCloseTo(0)
  expect(p2.y).toBeCloseTo(1)
  const p3 = m.apply({ x: 1, y: -1 })
  expect(p3.x).toBeCloseTo(6)
  expect(p3.y).toBeCloseTo(1)
  const p4 = m.apply({ x: -1, y: 1 })
  expect(p4.x).toBeCloseTo(0)
  expect(p4.y).toBeCloseTo(7)
});


// test('resize a vector after translation and rotation', () => {
//   const sp = Shaper.from(Affine.rotate(Math.PI / 4).translate(2, 3))
//   const m1 = sp.into();
//   const p1 = m1.apply({ x: 1, y: 1 })

//   // expect(p1.x).toBeCloseTo(2)
//   // expect(p1.y).toBeCloseTo(4.41)

//   // console.log('#',m1.apply({x:-1, y:-1}));


//   const m2 = sp.resize(0, 0, Anchor.CENTER, ResizeRatio.FREE)
//   const p2 = m2.apply({ x: 1, y: 1 })
//   console.log(p1, p2)
//   // expect(p2.x).toBeCloseTo(5.414)
//   // expect(p2.y).toBeCloseTo(6.414)
// })
