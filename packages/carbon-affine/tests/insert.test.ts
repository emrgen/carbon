import { expect, test } from "vitest";
import { Affine } from "../src/index";
import { Anchor, Handle, ResizeRatio, Shaper } from "../src/Shaper";

const sp = Shaper.default();
test("insert at a location, 200, 200", () => {
  const m = Affine.fromSize(100, 100);

  const insert = Shaper.from(m).translate(100, 100);
  expect(insert.into().toCSS()).toBe(
    Affine.fromCSS("matrix(50, 0, 0, 50, 100, 100)").toCSS(),
  );

  const rotate45 = insert.rotate(Math.PI / 4);
  // console.log(rotate45.into().toCSS());
  expect(rotate45.into().toCSS()).toBe(
    Affine.fromCSS(
      "matrix(35.35534, 35.35534, -35.35534, 35.35534, 100, 100)",
    ).toCSS(),
  );

  const translate100x100 = rotate45.translate(100, 100);
  // console.log(translate100x100.into().toCSS());
  expect(translate100x100.into().toCSS()).toBe(
    Affine.fromCSS(
      "matrix(35.35534, 35.35534, -35.35534, 35.35534, 200, 200)",
    ).toCSS(),
  );

  const resize = translate100x100.resize(
    -50,
    50,
    Anchor.CENTER,
    Handle.BOTTOM,
    ResizeRatio.FREE,
  );
  // console.log(resize.into().toCSS());
  expect(resize.into().toCSS()).toBe(
    Affine.fromCSS(
      "matrix(35.35534, 35.35534, -85.35534, 85.35534, 200, 200)",
    ).toCSS(),
  );

  const rotate90 = resize.rotate(Math.PI / 4);
  // console.log(rotate90.into().toCSS());
  expect(rotate90.into().toCSS()).toBe(
    Affine.fromCSS(
      "matrix(0.00000, 50.00000, -120.71068, 0.00000, 200.00000, 200.00000)",
    ).toCSS(),
  );

  const resize2 = rotate90.resize(
    50,
    50,
    Anchor.CENTER,
    Handle.RIGHT,
    ResizeRatio.FREE,
  );
  // console.log(resize2.into().toCSS());
  const resize3 = resize.resize(
    50,
    0,
    Anchor.TOP_LEFT,
    Handle.BOTTOM_RIGHT,
    ResizeRatio.FREE,
  );
  // console.log(resize3.into().toCSS());
  expect(resize3.into().toCSS()).toBe(
    Affine.fromCSS(
      "matrix(47.85534, 47.85534, -72.85534, 72.85534, 225.00000, 200.00000)",
    ).toCSS(),
  );

  const resize4 = resize.resize(
    50,
    50,
    Anchor.LEFT,
    Handle.RIGHT,
    ResizeRatio.FREE,
  );
  // console.log(resize4.into().toCSS());
  expect(resize4.into().toCSS()).toBe(
    Affine.fromCSS(
      "matrix(60.35534, 60.35534, -85.35534, 85.35534, 225.00000, 225.00000)",
    ).toCSS(),
  );
});

test("rotate after scaling", () => {
  const m = Affine.fromSize(100, 100);
  const sp = Shaper.from(m).translate(100, 100);
  expect(sp.into().toCSS()).toBe(
    Affine.fromCSS("matrix(50, 0, 0, 50, 100, 100)").toCSS(),
  );
  // console.log(sp.into().toCSS());

  const resize = sp.resize(20, 0, Anchor.LEFT, Handle.RIGHT, ResizeRatio.FREE);
  // console.log(resize.into().toCSS());
  expect(resize.into().toCSS()).toBe(
    Affine.fromCSS("matrix(60, 0, 0, 50, 110, 100)").toCSS(),
  );

  const rotate = resize.rotate(Math.PI / 4);
  // console.log(rotate.into().toCSS());
  expect(rotate.into().toCSS()).toBe(
    Affine.fromCSS(
      "matrix(42.42641, 42.42641, -35.35534, 35.35534, 110, 100)",
    ).toCSS(),
  );

  const resize1 = rotate.resize(
    -20,
    20,
    Anchor.TOP,
    Handle.BOTTOM,
    ResizeRatio.FREE,
  );
  // console.log(resize1.into().toCSS());
  expect(resize1.into().toCSS()).toBe(
    Affine.fromCSS(
      "matrix(42.42641, 42.42641, -45.35534, 45.35534, 100, 110)",
    ).toCSS(),
  );

  const resize2 = resize1.resize(
    0,
    50,
    Anchor.TOP_LEFT,
    Handle.BOTTOM_RIGHT,
    ResizeRatio.FREE,
  );
  // console.log(resize2.into().toCSS());
  expect(resize2.into().toCSS()).toBe(
    Affine.fromCSS(
      "matrix(54.92641, 54.92641, -57.85534, 57.85534, 100, 135)",
    ).toCSS(),
  );

  const rotate1 = resize2.rotate(-Math.PI / 4);
  // console.log(rotate1.into().toCSS());
  expect(rotate1.into().toCSS()).toBe(
    Affine.fromCSS("matrix(77.67767, 0, 0, 81.81981, 100, 135)").toCSS(),
  );

  const move = rotate1.translate(100, 100);
  // console.log(move.into().toCSS());
  expect(move.into().toCSS()).toBe(
    Affine.fromCSS("matrix(77.67767, 0, 0, 81.81981, 200, 235)").toCSS(),
  );
});