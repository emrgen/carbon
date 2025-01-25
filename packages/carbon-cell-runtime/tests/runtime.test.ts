import { test } from "vitest";
import { Cell } from "../src/Cell";
import { Promises } from "../src/Promises";
import { Runtime } from "../src/Runtime";

test("create a single variable", async (t) => {
  const runtime = Runtime.create("test", "0.0.1");
  const mod = runtime.define("1", "mod", "0.0.1");

  runtime.on("fulfilled", (cell, value) => {
    console.log("fulfilled:", cell.id, value);
  });

  runtime.on("rejected", (cell, value) => {
    console.log("rejected:", cell.id, value);
  });

  mod.define(
    Cell.create({
      id: "x1",
      name: "x",
      code: "() => 10",
      definition: () => 10,
    }),
  );

  await Promises.delay(100);
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
      },
    }),
  );

  await Promises.delay(100);
});
