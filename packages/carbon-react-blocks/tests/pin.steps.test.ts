import { test } from "vitest";
import { expect } from "vitest";
import { section, title } from "@emrgen/carbon-blocks";
import { text } from "@emrgen/carbon-blocks";
import { node } from "@emrgen/carbon-blocks";
import { createCarbon } from "./utils";
import { printSteps } from "@emrgen/carbon-core";
import { Position } from "@emrgen/carbon-core";

test("pin steps", () => {
  const json = node("document", [
    title([text("abc")]),
    section([title([text("abc")])]),
  ]);
  const app = createCarbon(json);

  printSteps(app.content);

  const pos = Position.toStartOf(app.content);
  console.log(pos?.toString());

  console.log(pos.move(1)?.toString());
  expect(pos.childDistance(app.content.child(1)!));
  const distance = pos.childDistance(app.content.child(1)!);
  console.log(distance);
});
