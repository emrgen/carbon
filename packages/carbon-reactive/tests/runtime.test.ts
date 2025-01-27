import lodash from "lodash";
import { expect, test } from "vitest";
import { Cell } from "../src/Cell";
import { Promises } from "../src/Promises";
import { Runtime } from "../src/Runtime";

function registerListeners(runtime: Runtime) {
  runtime
    .on("fulfilled", (v) => {
      console.log("fulfilled:", v.id, "=>", v.value);
    })
    .on("rejected", (v) => {
      console.log("rejected:", v.id, "=>", v.error?.toString());
    });
}

test(
  "create a single variable",
  async (t) => {
    const runtime = Runtime.create("test", "0.0.1");
    const mod = runtime.define("1", "mod", "0.0.1");
    registerListeners(runtime);

    mod.define(
      Cell.create({
        id: "x1",
        name: "x",
        code: "() => 10",
        definition: () => {
          return 10;
        },
      }),
    );

    await Promises.delay(100);
    expect(mod.variable("x1")!.value).toBe(10);
    console.log("1---------------------------------------------------");

    mod.define(
      Cell.create({
        id: "y1",
        name: "y",
        code: "() => x + 10",
        dependencies: ["x"],
        definition: (x) => x + 10,
      }),
    );

    await Promises.delay(100);
    expect(mod.variable("y1")!.value).toBe(20);
    console.log("2---------------------------------------------------");

    mod.redefine(
      Cell.create({
        id: "x1",
        name: "x",
        code: "() => 20",
        definition: () => 20,
      }),
    );

    await Promises.delay(100);
    expect(mod.variable("x1")!.value).toBe(20);
    console.log("3---------------------------------------------------");

    mod.redefine(
      Cell.create({
        id: "z1",
        name: "z",
        code: "(x, y) => x+y",
        dependencies: ["x", "y"],
        definition: (x, y) => x + y,
      }),
    );

    await Promises.delay(100).then(() => {
      mod.delete("x1");
    });

    console.log("4---------------------------------------------------");

    mod.redefine(
      Cell.create({
        id: "x1",
        name: "x",
        code: "() => 50",
        definition: () => 50,
      }),
    );

    await Promises.delay(100);
    expect(mod.variable("x1")!.value).toBe(50);
    expect(mod.variable("z1")!.value).toBe(110);
    console.log("5---------------------------------------------------");

    mod.define(
      Cell.create({
        id: "y1",
        name: "y",
        code: "() => x - 10",
        dependencies: ["x", "z"],
        definition: (x, z) => x - 10,
      }),
    );

    await Promises.delay(100);
    expect(mod.variable("y1")?.error?.toString()).toBe("RuntimeError: circular definition");
    console.log("6---------------------------------------------------");

    mod.define(
      Cell.create({
        id: "y1",
        name: "y",
        code: "() => x - 20",
        dependencies: ["x"],
        definition: (x) => x - 20,
      }),
    );

    await Promises.delay(100);
    expect(mod.variable("y1")!.value).toBe(30);
    console.log("7---------------------------------------------------");

    mod.define(
      Cell.create({
        id: "y1",
        name: "y",
        code: "() => x / 10",
        dependencies: ["x"],
        definition: (x) => x / 10,
      }),
    );

    await Promises.delay(100);
    expect(mod.variable("y1")!.value).toBe(5);
    console.log("8---------------------------------------------------");

    mod.define(
      Cell.create({
        id: "a1",
        name: "a",
        code: "() => {}",
        dependencies: [],
        definition: function* () {
          yield 1;
          yield 2;
          yield 3;
          let i = 0;
          while (true) {
            yield Promises.delay(500, i++);
          }
        },
      }),
    );

    mod.define(
      Cell.create({
        id: "b1",
        name: "b",
        code: "(a) => a + 10",
        dependencies: ["a"],
        definition: function (a) {
          return a + 10;
        },
      }),
    );

    mod.define(
      Cell.create({
        id: "c1",
        name: "c",
        code: "(b) => b + 10",
        dependencies: ["b"],
        definition: function (b) {
          return b + 10;
        },
      }),
    );

    mod.define(
      Cell.create({
        id: "d1",
        name: "d",
        code: "(a) => a++",
        dependencies: ["x"],
        definition: function* (x) {
          let i = 0;
          while (true) {
            yield Promises.delay(500, x + i++);
          }
        },
      }),
    );

    await Promises.delay(2000);
  },
  {
    timeout: 20000,
  },
);

test("create Promise variable", async (t) => {
  const runtime = Runtime.create("test", "0.0.1");
  const mod = runtime.define("1", "mod", "0.0.1");
  // registerListeners(runtime);

  mod.define(
    Cell.create({
      id: "x1",
      name: "x",
      code: "() => 10",
      definition: () => {
        return 10;
      },
    }),
  );

  await Promises.delay(100);
  expect(mod.variable("x1")!.value).toBe(10);

  mod.define(
    Cell.create({
      id: "y1",
      name: "y",
      code: "(x) => x + 10",
      dependencies: ["x"],
      definition: (x) => Promise.resolve().then(() => x + 10),
    }),
  );

  await Promises.delay(100);
  expect(mod.variable("y1")!.value).toBe(20);

  mod.define(
    Cell.create({
      id: "z1",
      name: "z",
      code: "(x, y) => x + y",
      dependencies: ["x", "y"],
      definition: function* (x, y) {
        yield Promise.resolve().then(() => x + y);
      },
    }),
  );

  await Promises.delay(100);
  expect(mod.variable("z1")!.value).toBe(30);

  mod.define(
    Cell.create({
      id: "z1",
      name: "z",
      code: "(x, y) => x - y",
      dependencies: ["x", "y"],
      definition: function* (x, y) {
        yield Promise.resolve().then(() => x - y);
      },
    }),
  );

  await Promises.delay(100);
  expect(mod.variable("z1")!.value).toBe(-10);

  mod.define(
    Cell.create({
      id: "y1",
      name: "y",
      code: "(x) => x - 10", // NOTE: without the code change the definition is not updated
      dependencies: ["x"],
      definition: (x) => Promise.resolve().then(() => x - 10),
    }),
  );

  await Promises.delay(100);
  expect(mod.variable("z1")!.value).toBe(10);
});

test("create constant variable", async (t) => {
  const runtime = Runtime.create("test", "0.0.1");
  const mod = runtime.define("mod", "mod", "0.0.1");
  registerListeners(runtime);

  mod.define(
    Cell.create({
      id: "x1",
      name: "x",
      code: "() => 10",
      definition: () => 10,
    }),
  );

  await Promises.delay(100);
  expect(mod.variable("x1")!.value).toBe(10);

  mod.define(
    Cell.create({
      id: "y1",
      name: "y",
      code: "(x) => x + 10",
      dependencies: ["x"],
      definition: (x) => x + 10,
    }),
  );

  await Promises.delay(100);
  expect(mod.variable("y1")!.value).toBe(20);

  mod.define(
    Cell.create({
      id: "x1",
      name: "z",
      code: "(x) => x",
      dependencies: ["x"],
      definition: (x) => x,
    }),
  );

  await Promises.delay(100);
  expect(mod.variable("x1")!.error?.toString()).toBe("RuntimeError: x is not defined");
});

test("import variable from another module", async (t) => {
  const runtime = Runtime.create("test", "0.0.1");
  const m1 = runtime.define("m1", "m1", "0.0.1");
  const m2 = runtime.define("m2", "m2", "0.0.1");
  // registerListeners(runtime);

  m1.define(
    Cell.create({
      id: "x1",
      name: "x",
      code: "() => 10",
      definition: () => Promises.delay(1000, 10),
    }),
  );
  await Promises.delay(100);

  m1.define(
    Cell.create({
      id: "x1",
      name: "x",
      code: "() => 20",
      definition: () => 20,
    }),
  );

  await Promises.delay(100);
  expect(m1.variable("x1")!.value).toBe(20);

  const m2y = m2.import("x", "y", m1);

  m1.define(
    Cell.create({
      id: "z1",
      name: "z",
      code: "() => 20",
      definition: function* () {
        let i = 1;
        while (true) {
          yield Promises.delay(10, i++);
          if (i > 3) break;
        }
      },
    }),
  );

  await Promises.delay(100);
  expect(m1.variable("z1")!.value).toBe(3);
  expect(m2y!.value).toBe(20);
});

test("duplicate definition", async (t) => {
  const runtime = Runtime.create("test", "0.0.1");
  const m1 = runtime.define("m1", "m1", "0.0.1");
  registerListeners(runtime);

  console.log("xx");
  m1.define(
    Cell.create({
      id: "x1",
      name: "x",
      code: "() => 10",
      definition: () => 10,
    }),
  );

  m1.define(
    Cell.create({
      id: "x2",
      name: "x",
      code: "() => 20",
      definition: () => 20,
    }),
  );

  m1.define(
    Cell.create({
      id: "y1",
      name: "y",
      code: "(x) => x",
      dependencies: ["x"],
      definition: (x) => x + 1,
    }),
  );

  m1.define(
    Cell.create({
      id: "z1",
      name: "z",
      code: "(y) => y",
      dependencies: ["y"],
      definition: (y) => y + 10,
    }),
  );

  await Promises.delay(100);
  m1.define(
    Cell.create({
      id: "a1",
      name: "a",
      code: "(y) => y",
      dependencies: [],
      definition: function* () {
        let i = 0;
        while (true) {
          yield Promises.delay(100, i++);
        }
      },
    }),
  );
  m1.define(
    Cell.create({
      id: "b1",
      name: "b",
      code: "(a) => a",
      dependencies: ["a"],
      definition: (a) => a + 1,
    }),
  );

  await Promises.delay(100);
});

test("builtin variables", async (t) => {
  const builtins = {
    author: "subhasis",
  };

  const runtime = Runtime.create("test", "0.0.1", builtins);
  const m1 = runtime.define("m1", "m1", "0.0.1");
  const m2 = runtime.define("m2", "m2", "0.0.1");
  registerListeners(runtime);

  m1.define(
    Cell.create({
      id: "x1",
      name: "x",
      code: "() => author",
      dependencies: ["author"],
      definition: (author) => `Hello ${author} from m1`,
    }),
  );

  m2.define(
    Cell.create({
      id: "x1",
      name: "x",
      code: "(x) => x",
      dependencies: ["author"],
      definition: (author) => `Hello ${author} from m2`,
    }),
  );

  await Promises.delay(100);

  m2.define(
    Cell.create({
      id: "y1",
      name: "y",
      code: "(a) => a",
      dependencies: ["author"],
      definition: (author) => `Hello ${author} from y`,
    }),
  );
});

test("builtin Promises", async (t) => {
  const builtins = {
    Promises: Promises,
    _: lodash,
  };

  const runtime = Runtime.create("test", "0.0.1", builtins);
  const m1 = runtime.define("m1", "m1", "0.0.1");
  // registerListeners(runtime);

  m1.define(
    Cell.create({
      id: "x1",
      name: "x",
      code: "() => Promises.delay(100, 10)",
      dependencies: ["Promises"],
      definition: (Promises) => Promises.delay(100, 10),
    }),
  );

  await Promises.delay(110);
  expect(m1.variable("x1")!.value).toBe(10);

  m1.define(
    Cell.create({
      id: "y1",
      name: "y",
      code: "(_) => _.range(4)",
      dependencies: ["_"],
      definition: function* (_) {
        let i = 1;
        while (true) {
          yield Promises.delay(10, _.range(i));
          if (++i > 2) break;
        }
      },
    }),
  );

  await Promises.delay(100);
  expect(m1.variable("y1")!.value).toEqual([0, 1]);
});

test("duplicate-1 definition fixed later", async (t) => {
  const runtime = Runtime.create("test", "0.0.1");
  const m1 = runtime.define("m1", "m1", "0.0.1");
  registerListeners(runtime);

  m1.define(
    Cell.create({
      id: "y1",
      name: "y",
      code: "(x) => x",
      dependencies: ["x"],
      definition: (x) => x,
    }),
  );

  m1.define(
    Cell.create({
      id: "x1",
      name: "x",
      code: "() => 10",
      definition: () => 10,
    }),
  );

  m1.define(
    Cell.create({
      id: "x2",
      name: "x",
      code: "() => 20",
      definition: () => 20,
    }),
  );

  await Promises.delay(100);

  m1.define(
    Cell.create({
      id: "x2",
      name: "z",
      code: "() => 20",
      definition: () => 20,
    }),
  );

  await Promises.delay(100);
  expect(m1.variable("x2")!.value).toBe(20);
  expect(m1.variable("x1")!.value).toBe(m1.variable("y1")!.value);
});

// test("mutable definition", async (t) => {
//   const runtime = Runtime.create("test", "0.0.1", {
//     Mutable: "123",
//   });
//   const m1 = runtime.define("m1", "m1", "0.0.1");
//   registerListeners(runtime);
//
//   m1.define(
//     Cell.create({
//       id: "x1",
//       name: "x",
//       code: "() => 10",
//       dependencies: ["Mutable", "z"],
//       definition: (Mutable) => {
//         if (!Mutable.variables.has("m1/x1")) {
//           Mutable.define("m1/x1", 0);
//         }
//
//         return Mutable.accessor("m1/x1")["m1/x1"];
//       },
//     }),
//   );
//
//   m1.define(
//     Cell.create({
//       id: "z1",
//       name: "z",
//       code: "() => 10",
//       dependencies: ["x"],
//       definition: (x) => {
//         return x + 10;
//       },
//     }),
//   );
//
//   m1.define(
//     Cell.create({
//       id: "y1",
//       name: "y",
//       code: "() => 10",
//       dependencies: ["Mutable"],
//       definition: function* (Mutable) {
//         let i = 1;
//         while (true) {
//           yield Promises.delay(100, i);
//           Mutable.accessor("m1/x1")["m1/x1"] = i;
//           if (++i > 13) break;
//         }
//       },
//     }),
//   );
//
//   await Promises.delay(2000);
//
//   m1.define(
//     Cell.create({
//       id: "x1",
//       name: "x",
//       code: "() => 10",
//       dependencies: ["Mutable"],
//       definition: (Mutable) => {
//         if (!Mutable.variables.has("m1/x1")) {
//           Mutable.define("m1/x1", 0);
//         }
//
//         return Mutable.accessor("m1/x1")["m1/x1"];
//       },
//     }),
//   );
//
//   await Promises.delay(100);
//   // expect(m1.variable("x")!.value).toBe(10);
// });
