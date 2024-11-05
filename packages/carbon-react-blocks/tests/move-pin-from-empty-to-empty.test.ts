import { mention, node, text, title } from "@emrgen/carbon-blocks";
import { expect, test } from "vitest";
import { createCarbon } from "./utils";

const json = node("callout", [
  title([text("t")]),
  paragraph([
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
