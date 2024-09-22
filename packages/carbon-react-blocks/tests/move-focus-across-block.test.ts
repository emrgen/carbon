import { section, title } from "@emrgen/carbon-blocks";
import { text } from "@emrgen/carbon-blocks";
import { node } from "@emrgen/carbon-blocks";
import { createCarbon } from "./utils";
import { nameOffset } from "./utils";
import { Focus } from "@emrgen/carbon-core";
import { test } from "vitest";
import { expect } from "vitest";

test("move focus across titles", () => {
  const json = section([title([text("abc")]), title([text("def")])]);

  const app = createCarbon(json);

  const textBlocks = app.content.children;
  const focus = Focus.toStartOf(textBlocks[0]);

  expect(focus?.isAtStart).toBe(true);
  expect(nameOffset(focus?.moveBy(1)!)).toBe("text:1");
  expect(nameOffset(focus?.moveBy(3)!)).toBe("text:3");

  expect(nameOffset(focus?.moveBy(4)!)).toBe("text:0");
  expect(nameOffset(focus?.moveBy(5)!)).toBe("text:1");
});

test("move focus across non-void and void title", () => {
  const json = node("section", [
    title([text("abc")]),
    section([title([text("def")])]),
    section([title()]),
    section([title([text("ghi")])]),
  ]);

  const app = createCarbon(json);

  const blocks = app.content.children;
  const focus = Focus.toStartOf(blocks[0]);

  expect(focus?.isAtStart).toBe(true);
  expect(nameOffset(focus?.moveBy(1)!)).toBe("text:1");
  expect(nameOffset(focus?.moveBy(3)!)).toBe("text:3");

  expect(nameOffset(focus?.moveBy(4)!)).toBe("text:0");
  expect(nameOffset(focus?.moveBy(7)!)).toBe("text:3");

  expect(nameOffset(focus?.moveBy(8)!)).toBe("title:0");

  expect(nameOffset(focus?.moveBy(9)!)).toBe("text:0");
  expect(nameOffset(focus?.moveBy(11)!)).toBe("text:2");
});
