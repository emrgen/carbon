import { test } from "vitest";
import { Cell } from "../src/index";
import { Runtime } from "../src/Runtime";
import { registerListeners } from "./listerners";

test("test literal variable computation", async (t) => {
  const runtime = new Runtime({
    a: 1,
  });
  registerListeners(runtime);

  const m = runtime.mod;

  m.define(Cell.from("x", "x", ["a"], (a) => a + 1));
  m.define(Cell.from("y", "y", ["a", "x"], (a, x) => a + x));

  m.redefine(Cell.from("x", "x", ["a"], (a) => a + 2));

  m.redefine(Cell.from("x", "x", ["y"], (a) => a + 2));
});

test("test calculation with deps", async (t) => {
  const runtime = new Runtime({});
  registerListeners(runtime);

  const m = runtime.mod;

  m.define(Cell.from("x", "x", ["a"], (a) => a + 1));
  m.define(Cell.from("y", "y", ["a", "x"], (a, x) => a + x));

  // m.redefine(Cell.from("x", "x", ["a"], (a) => a + 2));

  // m.redefine(Cell.from("x", "x", ["y"], (a) => a + 2));
});
