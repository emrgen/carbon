import { noop } from "lodash";
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

  expect(b.version).toBe("x#0.1");

  const c = a.then((x) => x + 1);

  expect(c.version).toBe("x#0.1");

  expect(await c).toBe(43);

  const x = Promix.resolve(10);
  expect(await x).toBe(10);
  expect(x.isFulfilled).toBe(true);
});

test("test Promix.any", async (t) => {
  const an = Promise.any([Promise.reject(1), Promise.resolve(2)]);
  expect(await an).toBe(2);

  const any = Promix.any([
    Promix.reject(1),
    Promix.resolve(2),
    Promix.resolve("3"),
  ]);

  expect(await any).toBe(2);
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
  expect(p2.version).toBe("x#0.1");

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

test("test promise tree", async (t) => {
  const a = Promix.default<number>("a");
  const b = Promix.default<number>("b");
  const c = Promix.all([a, b]).then(([x, y]) => x + y);
  const d = Promix.all([a, b]).then(([x, y]) => x * y);
  const e = Promix.all([a, c, d]).then(([x, y, z]) => x + y + z);

  const createLogger = (pass, ...vars: Promix<number>[]) => {
    console.log("-------------------------------");
    console.log("pass:", pass);
    vars.forEach((v, i) => {
      v.then((x) => {
        console.log(String.fromCharCode("a".charCodeAt(0) + i), ":", x);
      });
    });
  };

  // pass 1
  createLogger("1", a, b, c, d, e);
  a.fulfilled(10);
  b.fulfilled(20);
  expect(await e).toBe(10 + (await c) + (await d));

  // when a becomes dirty, it needs to update all its dependents and recomputed
  // first update the dependencies
  const a1 = a.then((x) => x + 10);
  const c1 = c.all([a1, b]).then(([x, y]) => x + y);
  const d1 = d.all([a1, b]).then(([x, y]) => x * y);
  const e1 = e.all([a1, c1, d1]).then(([x, y, z]) => x + y + z);

  // pass 2
  createLogger("2", a1, b, c1, d1, e1);
  a1.fulfilled(10);
  expect(await e1).toBe(20 + (await c1) + (await d1));

  // create a new variable
  const f = c1.all([a1, b]).then(([x, y]) => x + y);
  const g2 = Promix.all([d1, f]).then(([x, y]) => x + y);

  // pass 3
  createLogger("3", a1, b, c1, d1, e1, f, g2);
  expect(await g2).toBe((await d1) + (await f));

  // create a new variable
  const h = Promix.default<number>("h");
  const i = Promix.all([g2, h]).then(([x, y]) => x + y);

  // pass 4
  createLogger("4", a1, b, c1, d1, e1, f, g2, h, i);
  h.fulfilled(10);
  expect(await i).toBe((await g2) + (await h));
});

test(
  "test generator auto computation",
  async (t) => {
    function* gen() {
      let i = 0;
      while (true) {
        yield Promix.delay(100, i++);
      }
    }

    const g = gen();
    let done = Promix.delay(1000);

    const compute = (pass: number, p: Promix) => {
      console.log("-------------------------------");
      console.log("pass:", pass);
      p.then<number>(() => {
        return g.next().value as any;
      })
        .then((x) => {
          console.log("value:", x);
        })
        .then((x) => {
          setTimeout(() => {
            if (done.isFulfilled) return;
            compute(pass + 1, p.next(noop));
          }, 0);
        });

      p.fulfilled(1);
    };
    // compute(1, Promix.default("a"));

    // await Promises.delay(2000);
  },
  {
    // timeout: 10000,
  },
);
