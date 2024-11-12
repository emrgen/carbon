import { node, paragraph, text, title } from "@emrgen/carbon-blocks";
import { Focus, Mark, MarksPath } from "@emrgen/carbon-core";
import { expect, test } from "vitest";
import { Bold, Italic } from "./marks";
import { createCarbon, nameOffset } from "./utils";

test("move focus within text", () => {
  const json = paragraph([
    title([
      text("title", {
        [MarksPath]: [Mark.BOLD].map((m) => m.toJSON()),
      }),
      text("world"),
      text("carbon", {
        [MarksPath]: [Mark.BOLD].map((m) => m.toJSON()),
      }),
    ]),
  ]);

  const app = createCarbon(json);

  const focus = Focus.toStartOf(app.content);

  expect(focus?.isAtStart).toBe(true);
  expect(nameOffset(focus?.moveBy(1)!)).toBe("text:1");
  expect(nameOffset(focus?.moveBy(2)!)).toBe("text:2");
  expect(nameOffset(focus?.moveBy(5)!)).toBe("text:5");

  expect(nameOffset(focus?.moveBy(5).rightAlign)).toBe("text:0");

  expect(nameOffset(focus?.moveBy(6)!)).toBe("text:1");
  expect(nameOffset(focus?.moveBy(7)!)).toBe("text:2");
  expect(nameOffset(focus?.moveBy(10)!)).toBe("text:5");

  expect(nameOffset(focus?.moveBy(10)!.rightAlign)).toBe("text:0");

  expect(nameOffset(focus?.moveBy(11)!)).toBe("text:1");
  expect(nameOffset(focus?.moveBy(12)!)).toBe("text:2");
  expect(nameOffset(focus?.moveBy(15)!)).toBe("text:5");
});

test("move focus within text marks", () => {
  const json = paragraph([
    title([
      node("bold", [text("title")]),
      text("world"),
      node("italic", [text("carbon")]),
    ]),
  ]);
  const app = createCarbon(json, [new Bold(), new Italic()]);
  const focus = Focus.toStartOf(app.content);

  expect(focus?.isAtStart).toBe(true);
  expect(nameOffset(focus?.moveBy(1)!)).toBe("text:1");
  expect(nameOffset(focus?.moveBy(2)!)).toBe("text:2");
  expect(nameOffset(focus?.moveBy(5)!)).toBe("text:5");

  expect(nameOffset(focus?.moveBy(5)!.rightAlign)).toBe("text:0");

  expect(nameOffset(focus?.moveBy(6)!)).toBe("text:1");
  expect(nameOffset(focus?.moveBy(7)!)).toBe("text:2");
  expect(nameOffset(focus?.moveBy(10)!)).toBe("text:5");

  expect(nameOffset(focus?.moveBy(10)!.rightAlign)).toBe("text:0");

  expect(nameOffset(focus?.moveBy(11)!)).toBe("text:1");
  expect(nameOffset(focus?.moveBy(12)!)).toBe("text:2");
  expect(nameOffset(focus?.moveBy(15)!)).toBe("text:5");
});

test("move focus within text from empty to empty", () => {
  const json = paragraph([
    title([node("empty"), node("empty"), node("empty"), node("empty")]),
  ]);

  const app = createCarbon(json);

  const focus = Focus.toStartOf(app.content);

  const ids = app.content.child(0)!.children.map((n) => n.id.toString());

  // console.log(ids);

  expect(focus?.isAtStart).toBe(true);
  expect(focus?.node.id.toString()).toBe(ids[0]);

  expect(focus?.moveBy(1)!.node.id.toString()).toBe(ids[0]);
  expect(nameOffset(focus?.moveBy(1)!)).toBe("empty:1");

  expect(focus?.moveBy(2)!.node.id.toString()).toBe(ids[1]);
  expect(nameOffset(focus?.moveBy(2)!)).toBe("empty:1");

  expect(focus?.moveBy(3)!.node.id.toString()).toBe(ids[2]);
  expect(nameOffset(focus?.moveBy(3)!)).toBe("empty:1");

  const end = focus?.moveBy(3)!;

  console.log(end?.toString());
  expect(end?.moveBy(-1)!.node.id.toString()).toBe(ids[2]);
  expect(nameOffset(end?.moveBy(-1)!)).toBe("empty:0");

  expect(end?.moveBy(-2)!.node.id.toString()).toBe(ids[1]);
  expect(nameOffset(end?.moveBy(-2)!)).toBe("empty:0");

  expect(end?.moveBy(-3)!.node.id.toString()).toBe(ids[0]);
  expect(nameOffset(end?.moveBy(-3)!)).toBe("empty:0");
});

// test("move focus within text between atoms", () => {
//   const json = paragraph([
//     title([
//       node("empty"),
//       mention("hello"),
//       node("empty"),
//       mention("world"),
//       node("empty"),
//       node("empty"),
//     ]),
//   ]);
//
//   const app = createCarbon(json);
//   const ids = app.content
//     .descendants((n) => n.isZero)
//     .map((n) => n.id.toString());
//   console.log(ids);
//
//   const focus = Focus.toStartOf(app.content);
//
//   expect(focus?.isAtStart).toBe(true);
//   expect(nameOffset(focus!)).toBe("empty:0");
//
//   expect(focus?.moveBy(2)!.node.id.toString()).toBe(ids[1]);
//   expect(nameOffset(focus?.moveBy(1)!)).toBe("empty:1");
//
//   expect(focus?.moveBy(3)!.node.id.toString()).toBe(ids[4]);
//   expect(nameOffset(focus?.moveBy(2)!)).toBe("empty:1");
//
//   expect(focus?.moveBy(3)!.node.id.toString()).toBe(ids[5]);
//   expect(nameOffset(focus?.moveBy(3)!)).toBe("empty:1");
//
//   const end = focus?.moveBy(3)!;
//
//   expect(end?.moveBy(-1)!.node.id.toString()).toBe(ids[4]);
//   expect(nameOffset(end?.moveBy(-1)!)).toBe("empty:0");
//
//   expect(end?.moveBy(-2)!.node.id.toString()).toBe(ids[2]);
//   expect(nameOffset(end?.moveBy(-2)!)).toBe("empty:0");
//
//   expect(end?.moveBy(-3)!.node.id.toString()).toBe(ids[0]);
//   expect(nameOffset(end?.moveBy(-3)!)).toBe("empty:0");
// });
