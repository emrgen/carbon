import { expect, test } from "vitest";
import { Cell, Runtime } from "../src/index";
import { Mutable } from "../src/Mutable";
import { Promises } from "../src/Promises";
import { Variable } from "../src/Variable";

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

  const m1 = new Mutable(runtime);
  m1.define("a", 0);
  m1.accessor("a")["a"] = 1;
  expect(m1.variables.get("a")).toEqual(1);

  m1.delete("a");

  expect(() => {
    m1.accessor("a")["a"];
  }).toThrowError("not defined");
});

test("mutable definition with mutable injection", async (t) => {
  const runtime = Runtime.create("test", "0.0.1");
  const m1 = runtime.define("m1", "m1", "0.0.1");
  registerListeners(runtime);

  // hidden variable
  m1.define(Cell.from("immutable_x1", "immutable x", [], (ix) => ix));

  // visible variable
  m1.define(
    Cell.create({
      id: "mutable_x",
      name: "mutable x",
      dependencies: ["immutable x"],
      definition: function (ix) {
        const that = this as Variable;

        const ret = {
          current: ix,
          next: function () {
            return {
              value: ret,
              done: true,
            };
          },
          return: function () {
            return {
              value: ret,
              done: true,
            };
          },
          get value() {
            return ret.current;
          },
          // set the value of the variable x and mark the downstream variables as dirty
          set value(value) {
            // console.log("setting mutable x", Variable.fullName(m1.name, "x"), value);
            // mark the variable x as dirty
            const variables = that.runtime.moduleVariables.get(Variable.fullName(m1.name, "x"));
            if (variables) {
              console.log(variables.map((v) => v.id));
              variables.forEach((variable) => {
                that.runtime.dirty.add(variable);
              });
            }

            ret.current = value;
          },
        };

        return ret;
      },
    }),
  );

  // visible variable
  m1.define(Cell.from("x1", "x", ["mutable x"], (mx) => mx.value));

  m1.define(Cell.from("x2", "x", [], () => 2));
  // m1.define(Cell.from("z1", "z", ["x"], (x) => x));
  m1.define(Cell.from("a1", "a", ["mutable x"], (mx) => mx.value));

  m1.define(
    Cell.from("y1", "y", ["mutable x"], function* (mx) {
      let i = 1;
      while (true) {
        yield Promises.tick(200, () => {
          return (mx.value = i);
        });

        if (++i > 13) break;
      }
    }),
  );

  m1.define(
    Cell.from("b1", "b", ["mutable x"], function* (mx) {
      let i = 1;
      while (true) {
        yield Promises.tick(100, () => {
          return mx.value;
        });

        if (++i > 100) break;
      }
    }),
  );

  m1.define(Cell.from("p1", "p", ["mutable x", "q"], (mx, q) => mx.value + q));
  m1.define(Cell.from("q1", "q", ["p"], (p) => p));

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
