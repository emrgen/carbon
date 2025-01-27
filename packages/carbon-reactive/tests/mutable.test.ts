import { expect, test } from "vitest";
import { Runtime } from "../src/index";
import { Mutable } from "../src/Mutable";

test("test mutable", async (t) => {
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
