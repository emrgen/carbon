import { expect, test } from "vitest";
import { Promix } from "../src/Promix";

test("test promised", async (t) => {
  const a = Promix.default<number>().withId("x");

  expect(a.isPending).toBe(true);
  setTimeout(() => {
    a.fulfilled(42);
  }, 100);

  expect(await a).toBe(42);
  expect(a.isPending).toBe(false);
  expect(a.isFulfilled).toBe(true);

  const b = a.then((x) => x * 2);
  expect(await b).toBe(84);

  expect(b.version).toBe("x@0.1");

  const c = a.then((x) => x + 1);

  expect(c.version).toBe("x@0.1");

  expect(await c).toBe(43);

  const x = Promix.resolve(10);
  expect(await x).toBe(10);
  expect(x.isFulfilled).toBe(true);
});