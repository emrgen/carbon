import { expect, test } from "vitest";
import { Promix } from "../src/Promix";

test("test promised", async (t) => {
  const a = Promix.default<number>("x");

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

test("test Promix.all", async (t) => {
  const all = Promix.all([
    Promix.resolve(1),
    Promix.resolve(2),
    Promix.resolve(3),
  ]);

  expect(await all).toEqual([1, 2, 3]);
});

test("test then", async (t) => {
  const p = Promix.of<number>((y) => y(10));
  expect(await p.then((x) => x * 2)).toBe(20);
});

test("test next promise", async (t) => {
  const p = Promix.of<number>((y) => y(10), "x");
  const p2 = p.then((x) => x * 2);

  expect(await p2).toBe(20);
  expect(p2.version).toBe("x@0.1");

  const p3 = p2.next((y, n) => {
    y(30);
  });

  expect(await p3).toBe(30);

  const a = Promix.default();
  const b = a.then(() => 42);

  setTimeout(() => {
    a.fulfilled(10);
  }, 10);
  expect(await b).toBe(42);

  const c = a.next<number>((y) => {
    y(20);
  });

  expect(await c).toBe(20);
});

// test("test Promix.any", async (t) => {
//   const an = Promise.any([Promise.reject(1), Promise.resolve(2)]);
//   expect(await an).toBe(2);
//
//   const any = Promix.any([
//     Promix.reject(1),
//     Promix.resolve(2),
//     Promix.resolve("3"),
//   ]);
//
//   expect(await any).toBe(2);
// });

const x = new Promise<number>((resolve) => resolve(42));

test("test promise tree", async (t) => {
  const a = Promix.default<number>("a");
  const a1 = Promix.default<string>("a1");
  const x = Promix.all([Promix.resolve(1), Promise.resolve(""), 1, ""]);
});