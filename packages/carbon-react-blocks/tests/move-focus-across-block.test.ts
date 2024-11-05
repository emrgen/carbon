import { node, text, title } from "@emrgen/carbon-blocks";
import { Focus } from "@emrgen/carbon-core";
import { expect, test } from "vitest";
import { createCarbon, nameOffset } from "./utils";

test("move focus across titles", () => {
  const json = paragraph([title([text("abc")]), title([text("def")])]);

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
  const json = node("paragraph", [
    title([text("abc")]),
    paragraph([title([text("def")])]),
    paragraph([title()]),
    paragraph([title([text("ghi")])]),
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

test("move focus across multiple void title", () => {
  const json = node("paragraph", [
    title([]),
    paragraph([title([])]),
    paragraph([title()]),
    paragraph([title([])]),
  ]);
  const app = createCarbon(json);

  const blocks = app.content.children;
  const ids = blocks.map((b) =>
    b.find((n) => n.isTextContainer)!.id.toString(),
  );
  const focus = Focus.toStartOf(blocks[0]);

  expect(focus?.isAtStart).toBe(true);
  expect(nameOffset(focus?.moveBy(0)!)).toBe("title:0");
  expect(focus?.node.id.toString()).toBe(ids[0]);

  expect(nameOffset(focus?.moveBy(1)!)).toBe("title:0");
  expect(focus?.moveBy(1)!.node.id.toString()).toBe(ids[1]);

  expect(nameOffset(focus?.moveBy(2)!)).toBe("title:0");
  expect(focus?.moveBy(2)!.node.id.toString()).toBe(ids[2]);

  expect(nameOffset(focus?.moveBy(3)!)).toBe("title:0");
  expect(focus?.moveBy(3)!.node.id.toString()).toBe(ids[3]);

  const end = focus?.moveBy(3)!;

  expect(nameOffset(end?.moveBy(-1)!)).toBe("title:0");
  expect(end?.moveBy(-1)!.node.id.toString()).toBe(ids[2]);

  expect(nameOffset(end?.moveBy(-2)!)).toBe("title:0");
  expect(end?.moveBy(-2)!.node.id.toString()).toBe(ids[1]);

  expect(nameOffset(end?.moveBy(-3)!)).toBe("title:0");
  expect(end?.moveBy(-3)!.node.id.toString()).toBe(ids[0]);
});
