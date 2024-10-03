import { section, title } from "@emrgen/carbon-blocks";
import { text } from "@emrgen/carbon-blocks";
import { node } from "@emrgen/carbon-blocks";
import { mention } from "@emrgen/carbon-blocks";
import { createCarbon } from "./utils";
import { test } from "vitest";
import { expect } from "vitest";

const json = node("callout", [
  title([text("t")]),
  section([
    title([
      node("empty"),
      mention("hello"),
      node("empty"),
      mention("world"),
      node("empty"),
    ]),
  ]),
]);
const app = createCarbon(json);

// printSteps(app.content);

test("move focus within text", () => {
  expect(1).toBe(1);
});
