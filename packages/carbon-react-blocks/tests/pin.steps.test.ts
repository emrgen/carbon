import { test } from "vitest";
import { expect } from "vitest";
import { section, title } from "@emrgen/carbon-blocks";
import { text } from "@emrgen/carbon-blocks";
import { node } from "@emrgen/carbon-blocks";
import { createCarbon } from "./utils";
import { printSteps } from "@emrgen/carbon-core";
import { Position } from "@emrgen/carbon-core";

test("pin step forwards ", () => {
  const json = node("document", [
    title([text("abc")]),
    section([title([text("def")])]),
  ]);
  const app = createCarbon(json);
  // printSteps(app.content);

  const pos = Position.toStartOf(app.content);
  console.log(pos?.toString());

  const distance = pos.childDistance(app.content.child(1)!);
  expect(distance).toBe(8);

  expect(pos.moveBy(5).node.textContent).toBe("abc");
  expect(pos.moveBy(11).node.textContent).toBe("def");
  expect(pos.moveBy(18).node.name).toBe("document");

  expect(pos.moveBy(8).node.name).toBe("title");
});

test("pin step backwards ", () => {
  const json = node("document", [
    title([text("abc")]),
    section([title([text("def")])]),
  ]);
  const app = createCarbon(json);

  printSteps(app.content);

  const pos = Position.toEndOf(app.content);
  console.log(pos.toString());

  // expect(pos.moveBy(-2).node.name).toBe("section");
  // console.log(pos.moveBy(-3).toString());
  // expect(pos.moveBy(-3).node.name).toBe("section");
  expect(pos.moveBy(-3).down().node.name).toBe("text");
  expect(pos.moveBy(-4).down().node.name).toBe("text");
  expect(pos.moveBy(-9).down().node.name).toBe("title");
  expect(pos.moveBy(-10).down().node.name).toBe("section");

  expect(pos.moveBy(-11).down().node.name).toBe("text");
  expect(pos.moveBy(-16).down().node.name).toBe("text");
  expect(pos.moveBy(-17).down().node.name).toBe("title");
  expect(pos.moveBy(-18).down().node.name).toBe("document");
});
