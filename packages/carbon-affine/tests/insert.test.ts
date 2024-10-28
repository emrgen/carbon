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
  console.log(rotate45.into().toCSS());
  expect(rotate45.into().toCSS()).toBe(
    Affine.fromCSS(
      "matrix(35.35534, 35.35534, -35.35534, 35.35534, 100, 100)",
    ).toCSS(),
  );

  const translate100x100 = rotate45.translate(100, 100);
  console.log(translate100x100.into().toCSS());
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
  console.log(resize.into().toCSS());
  expect(resize.into().toCSS()).toBe(
    Affine.fromCSS(
      "matrix(35.35534, 35.35534, -85.35534, 85.35534, 200, 200)",
    ).toCSS(),
  );

  const rotate90 = resize.rotate(Math.PI / 4);
  console.log(rotate90.into().toCSS());
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
  console.log(resize2.into().toCSS());

  console.log("center", resize2.center());

  console.log(resize2.into().toCSS());
});