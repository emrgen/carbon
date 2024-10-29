import { expect, test } from "vitest";
import {
  Affine,
  ResizeRatio,
  Shaper,
  TransformAnchor,
  TransformHandle,
  Vector,
} from "../src/index";

const old = Affine.translate(10, 0)
  .rotate(Math.PI / 4)
  .apply({ x: 1, y: 0 });
const sp = Shaper.default();

test("translate a vector", () => {
  const m1 = sp.translate(2, 3);
  const v1 = Vector.of(1, 1);
  const p1 = m1.apply(v1.toObject());

  expect(p1.x).toBeCloseTo(3);
  expect(p1.y).toBeCloseTo(4);
});

test("translate a old vector", () => {
  const p = Shaper.default().translate(2, 3).apply(old);
  expect(p.x).toBeCloseTo(12.707);
  expect(p.y).toBeCloseTo(3.707);
});

test("resize at zero wrt ref", () => {
  {
    const p1 = sp
      .resize(
        2,
        2,
        TransformAnchor.CENTER,
        TransformHandle.BOTTOM_RIGHT,
        ResizeRatio.FREE,
      )
      .apply({ x: 1, y: 1 });
    expect(p1.x).toBeCloseTo(3);
    expect(p1.y).toBeCloseTo(3);
  }

  {
    // resize wrt left should not change the x coordinate of left side
    const m = sp.resize(
      2,
      2,
      TransformAnchor.LEFT,
      TransformHandle.RIGHT,
      ResizeRatio.FREE,
    );
    const p2 = m.apply({ x: 1, y: 1 });
    expect(p2.x).toBeCloseTo(3);
    expect(p2.y).toBeCloseTo(1);
    const p3 = m.apply({ x: -1, y: 0 });
    expect(p3.x).toBeCloseTo(-1);
  }

  {
    // resize wrt right should not change the x coordinate of right side
    const m = sp.resize(
      -2,
      2,
      TransformAnchor.RIGHT,
      TransformHandle.LEFT,
      ResizeRatio.FREE,
    );
    const p2 = m.apply({ x: -1, y: 1 });
    expect(p2.x).toBeCloseTo(-3);
    expect(p2.y).toBeCloseTo(1);
    const p3 = m.apply({ x: 1, y: 0 });
    expect(p3.x).toBeCloseTo(1);
  }

  {
    // resize wrt top should not change the y coordinate of top side
    const m = sp.resize(
      2,
      2,
      TransformAnchor.TOP,
      TransformHandle.BOTTOM,
      ResizeRatio.FREE,
    );
    const p2 = m.apply({ x: 1, y: 1 });
    expect(p2.x).toBeCloseTo(1);
    expect(p2.y).toBeCloseTo(3);
    const p3 = m.apply({ x: 0, y: -1 });
    expect(p3.y).toBeCloseTo(-1);
  }

  {
    // resize wrt bottom should not change the y coordinate of bottom side
    const m = sp.resize(
      2,
      -2,
      TransformAnchor.BOTTOM,
      TransformHandle.TOP,
      ResizeRatio.FREE,
    );
    const p1 = m.apply({ x: 1, y: -1 });
    expect(p1.x).toBeCloseTo(1);
    expect(p1.y).toBeCloseTo(-3);
    const p2 = m.apply({ x: 0, y: 1 });
    expect(p2.y).toBeCloseTo(1);
  }

  {
    // resize wrt top-left should not change the x coordinate of left side and y coordinate of top side
    const m = sp.resize(
      2,
      2,
      TransformAnchor.TOP_LEFT,
      TransformHandle.BOTTOM_RIGHT,
      ResizeRatio.FREE,
    );
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
    const m = sp.resize(
      -2,
      2,
      TransformAnchor.TOP_RIGHT,
      TransformHandle.BOTTOM_LEFT,
      ResizeRatio.FREE,
    );
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
    const m = sp.resize(
      2,
      -2,
      TransformAnchor.BOTTOM_LEFT,
      TransformHandle.TOP_RIGHT,
      ResizeRatio.FREE,
    );
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
    const m = sp.resize(
      -2,
      -2,
      TransformAnchor.BOTTOM_RIGHT,
      TransformHandle.TOP_LEFT,
      ResizeRatio.FREE,
    );
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

test("rotate at zero", () => {
  const p1 = sp.rotate(Math.PI / 4).apply({ x: 1, y: 1 });
  expect(p1.x).toBeCloseTo(0);
  expect(p1.y).toBeCloseTo(Math.SQRT2);
});

test("translate and resize", () => {
  const m = Shaper.from(Affine.translate(3, 4)).resize(
    2,
    2,
    TransformAnchor.CENTER,
    TransformHandle.BOTTOM_RIGHT,
    ResizeRatio.FREE,
  );
  const p1 = m.apply({ x: 1, y: 1 });
  expect(p1.x).toBeCloseTo(6);
  expect(p1.y).toBeCloseTo(7);
  const p2 = m.apply({ x: -1, y: -1 });
  expect(p2.x).toBeCloseTo(0);
  expect(p2.y).toBeCloseTo(1);
  const p3 = m.apply({ x: 1, y: -1 });
  expect(p3.x).toBeCloseTo(6);
  expect(p3.y).toBeCloseTo(1);
  const p4 = m.apply({ x: -1, y: 1 });
  expect(p4.x).toBeCloseTo(0);
  expect(p4.y).toBeCloseTo(7);
});

test("translate a vector after translation and rotation", () => {
  const sp = Shaper.from(Affine.translate(2, 3).rotate(Math.PI / 4));
  const p1 = sp.apply({ x: 1, y: 1 });
  expect(p1.x).toBeCloseTo(2);
  expect(p1.y).toBeCloseTo(4.41);

  const m = sp.translate(2, 3);
  const p2 = m.apply({ x: 1, y: 1 });
  expect(p2.x).toBeCloseTo(4);
  expect(p2.y).toBeCloseTo(7.41);
});

test("rotate a vector after translation and rotation", () => {
  const sp = Shaper.from(Affine.translate(2, 3).rotate(Math.PI / 4));
  const p1 = sp.apply({ x: 1, y: 1 });
  expect(p1.x).toBeCloseTo(2);
  expect(p1.y).toBeCloseTo(4.41);

  const m = sp.rotate(Math.PI / 4);
  const p2 = m.apply({ x: 1, y: 1 });
  expect(p2.x).toBeCloseTo(1);
  expect(p2.y).toBeCloseTo(4);
});

test("resize a vector after translation and rotation", () => {
  const sp = Shaper.from(Affine.translate(2, 3).rotate(Math.PI / 4));
  const p1 = sp.apply({ x: 1, y: 1 });
  expect(p1.x).toBeCloseTo(2);
  expect(p1.y).toBeCloseTo(4.41);

  const m = sp.resize(
    2,
    2,
    TransformAnchor.CENTER,
    TransformHandle.BOTTOM_RIGHT,
    ResizeRatio.FREE,
  );
  const p2 = m.apply({ x: 1, y: 1 });
  expect(p2.x).toBeCloseTo(4);
  expect(p2.y).toBeCloseTo(6.41);
});

// test("resize a vector after chain of transformation", () => {
//   const sp = Shaper.from(
//     Affine.translate(2, 3)
//       .rotate(Math.PI / 4)
//       .translate(3, 2)
//       .scale(2, 3),
//   );
//   const p1 = sp.apply({ x: 10, y: 10 });
//   console.log(p1);
//
//   const { width, height } = sp.size();
//   console.log(width, height);
// });

test("flip a vector", () => {
  const sp = Shaper.default().flipX();
  const p1 = sp.apply({ x: 1, y: 1 });
  expect(p1.x).toBeCloseTo(-1);
  expect(p1.y).toBeCloseTo(1);
});

test("flip a vector after translation", () => {
  const sp = Shaper.default().translate(2, 3).flipX();
  const p1 = sp.apply({ x: 1, y: 1 });
  expect(p1.x).toBeCloseTo(1);
  expect(p1.y).toBeCloseTo(4);
});
