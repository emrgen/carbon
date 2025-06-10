import { expect, test } from "vitest";
import { Cell, Runtime } from "../src/index";
import { Promises } from "../src/Promises";
import { MutableAccessor } from "../src/types";
import { RuntimeError } from "../src/x";

function registerListeners(runtime: Runtime) {
  runtime
    .on("fulfilled", (v) => {
      console.log("fulfilled:", v.id, "=>", v.value);
    })
    .on("rejected", (v) => {
      console.log("rejected:", v.id, "=>", v.error?.toString());
    });
}

test("test mutable injection", async (t) => {
  const runtime = Runtime.create("test", "0.0.1");
  const m = runtime.mutable;
  m.define("a", 0);

  const accessor = m.accessor<number>("a");
  accessor.value = 1;
  expect(accessor.value).toEqual(1);

  accessor.value = 2;
  expect(accessor.value).toEqual(2);

  accessor.value = 3;
  expect(accessor.value).toEqual(3);

  m.delete("a");

  expect(() => {
    accessor.value = 2;
  }).toThrowError("not defined");
});

test("mutable definition with mutable injection", async (t) => {
  const runtime = Runtime.create("test", "0.0.1");
  const mut = runtime.mutable;
  const m = runtime.define("m1", "m1", "0.0.1");

  registerListeners(runtime);

  mut.define("x", 0);

  // visible variable
  m.define(
    Cell.create({
      id: "mutable_x",
      name: "mutable@x",
      dependencies: [],
      definition: function () {
        return mut.accessor<any>("x");
      },
    }),
  );

  // hidden variable initialized by the initial mutable value
  m.define(Cell.from("immutable_x", "x", ["mutable@x"], () => mut.accessor<any>("x").value));

  // m.define(Cell.from("x2", "x", [], () => 2));
  // // m1.define(Cell.from("z1", "z", ["x"], (x) => x));
  m.define(Cell.from("a1", "a", ["mutable@x"], (mx) => mx.value));

  m.define(
    Cell.from("b1", "b", ["mutable@x"], function* (mx) {
      let i = 1;
      while (true) {
        yield Promises.tick(200, () => {
          return (mx.value = i);
        });

        if (++i > 13) break;
      }
    }),
  );

  m.define(
    Cell.from("c1", "c", ["mutable@x"], function* (mx) {
      let i = 1;
      while (true) {
        yield Promises.tick(200, () => {
          return mx.value;
        });

        if (++i > 100) break;
      }
    }),
  );

  m.define(Cell.from("p1", "p", ["mutable x", "q"], (mx, q) => mx.value + q));
  m.define(Cell.from("q1", "q", ["p"], (p) => p));

  await Promises.delay(1000);

  expect(m.variable("p1")!.error!.toString()).toBe(RuntimeError.circularDependency().toString());
});

test("mutable update from different cell", async (t) => {
  const runtime = Runtime.create("test", "0.0.1");
  registerListeners(runtime);

  const m = runtime.define("m1", "m1", "0.0.1");
  m.defineMutable(Cell.from("x1", "x", [], () => 10));
  m.define(Cell.from("a1", "a", ["x"], (x: number) => x + 10));
  // m.define(
  //   Cell.from("b1", "b", ["x"], (x: number) => {
  //     return Promises.delay(200, () => {
  //       return x;
  //     });
  //   }),
  // );

  m.define(
    Cell.from("c1", "c", ["mutable@x"], function* (accessor: MutableAccessor<number>) {
      let i = 1;
      while (true) {
        yield Promises.tick(200, () => {
          const value = (accessor.value = i++);
          return value + 5;
        });
      }
    }),
  );

  await Promises.delay(1000);
});

//   m1.
test("mutable definition", async (t) => {
  const runtime = Runtime.create("test", "0.0.1");
  const m1 = runtime.define("m1", "m1", "0.0.1");
  registerListeners(runtime);

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

  // m1.define(
  //   Cell.create({
  //     id: "x1",
  //     name: "x",
  //     code: "() => 10",
  //     dependencies: ["Mutable", "z"],
  //     definition: (Mutable) => {
  //       if (!Mutable.variables.has("m1/x1")) {
  //         Mutable.define("m1/x1", 0);
  //       }
  //
  //       return Mutable.accessor("m1/x1")["m1/x1"];
  //     },
  //   }),
  // );

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
});
