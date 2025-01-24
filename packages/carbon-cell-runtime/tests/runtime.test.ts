import { test } from "vitest";
import { Runtime } from "../src/Runtime";

test("create a single variable", async (t) => {
  const runtime = Runtime.create("test", "0.0.1");
  const mod = runtime.define("1", "mod", "0.0.1");

  console.log(mod.version);
});
