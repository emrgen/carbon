import { assert, test } from "vitest";
import { Pin, PinnedSelection, PointedSelection } from "@emrgen/carbon-core";

test("create identity selection", () => {
  const sel = PinnedSelection.IDENTITY;
  assert(sel.isIdentity);

  const point = Pin.IDENTITY;
  assert(point.isIdentity);

  assert(sel.head.eq(point));
  assert(sel.tail.eq(point));

  const pointed = sel.unpin();

  assert(pointed.isIdentity);

  assert(pointed.head.eq(point.point));
  assert(pointed.tail.eq(point.point));

  const pointed2 = PointedSelection.IDENTITY;
  assert(pointed2.isIdentity);

  assert(pointed2.head.eq(point.point));
  assert(pointed2.tail.eq(point.point));
});
