import { expect, test } from "vitest";
import {
  Affine,
  ResizeRatio,
  Shaper,
  TransformAnchor,
  TransformHandle,
} from "../src/index";

test("insert and move, resize, rotate", () => {
  const sp = Shaper.from(Affine.fromSize(10, 10).scale(5, 5))
    .translate(100, 100)
    .resize(
      20,
      1,
      TransformAnchor.LEFT,
      TransformHandle.RIGHT,
      ResizeRatio.FREE,
    );

  // console.log(sp.toCSS());
  expect(sp.toCSS()).toBe(
    Affine.fromCSS(
      "matrix(35.00000, 0.00000, 0.00000, 25.00000, 110.00000, 100.00000)",
    ).toCSS(),
  );

  const sp2 = sp.translate(100, 100);
  // console.log(sp2.toCSS());
  expect(sp2.toCSS()).toBe(
    Affine.fromCSS(
      "matrix(35.00000, 0.00000, 0.00000, 25.00000, 210.00000, 200.00000)",
    ).toCSS(),
  );

  const sp3 = sp2.rotate(Math.PI / 4);
  // console.log(sp3.toCSS());
  expect(sp3.toCSS()).toBe(
    Affine.fromCSS(
      "matrix(24.74874, 24.74874, -17.67767, 17.67767, 210.00000, 200.00000)",
    ).toCSS(),
  );

  const sp4 = sp3.translate(-100, 0);
  // console.log(sp4.toCSS());
  expect(sp4.toCSS()).toBe(
    Affine.fromCSS(
      "matrix(24.74874, 24.74874, -17.67767, 17.67767, 110.00000, 200.00000)",
    ).toCSS(),
  );

  const sp5 = sp4.resize(
    1,
    50,
    TransformAnchor.CENTER,
    TransformHandle.RIGHT,
    ResizeRatio.FREE,
  );
  // console.log(sp5.toCSS());
  expect(sp5.toCSS()).toBe(
    Affine.fromCSS(
      "matrix(50.24874, 50.24874, -17.67767, 17.67767, 110.00000, 200.00000)",
    ).toCSS(),
  );

  console.log(sp5.size());
  console.log(sp5.center());
  console.log(sp5.angle);

  const sp6 = sp5.translate(0, -100);
  // console.log(sp6.toCSS());
  expect(sp6.toCSS()).toBe(
    Affine.fromCSS(
      "matrix(50.24874, 50.24874, -17.67767, 17.67767, 110.00000, 100.00000)",
    ).toCSS(),
  );

  const sp7 = sp6.rotate(-Math.PI / 4);
  // console.log(sp7.toCSS());
  expect(sp7.toCSS()).toBe(
    Affine.fromCSS(
      "matrix(71.06245, 0.00000, 0.00000, 25.00000, 110.00000, 100.00000)",
    ).toCSS(),
  );
});
