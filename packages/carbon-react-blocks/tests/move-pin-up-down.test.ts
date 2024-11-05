import { text, title } from "@emrgen/carbon-blocks";
import { Focus } from "@emrgen/carbon-core";
import { expect, test } from "vitest";
import { createCarbon, nameOffset } from "./utils";

test("move focus up", () => {
  const json = paragraph([title([text("hello"), text("world")])]);

  const app = createCarbon(json);

  const focus = Focus.toStartOf(app.content);
  expect(focus?.isAtStart).toBe(true);

  expect(nameOffset(focus?.up()!)).toBe("title:0");
  expect(nameOffset(focus?.moveBy(1).up()!)).toBe("title:1");
  expect(nameOffset(focus?.moveBy(3).up()!)).toBe("title:3");
  expect(nameOffset(focus?.moveBy(5).up()!)).toBe("title:5");

  expect(nameOffset(focus?.moveBy(6).up()!)).toBe("title:6");
  expect(nameOffset(focus?.moveBy(8).up()!)).toBe("title:8");
  expect(nameOffset(focus?.moveBy(10).up()!)).toBe("title:10");
});

test("move focus down", () => {
  const json = paragraph([title([text("hello"), text("world")])]);

  const app = createCarbon(json);

  const textBlock = app.content.firstChild!;

  expect(nameOffset(Focus.create(textBlock, 0)!.down())).toBe("text:0");
  expect(nameOffset(Focus.create(textBlock, 1)!.down())).toBe("text:1");
  expect(nameOffset(Focus.create(textBlock, 4)!.down())).toBe("text:4");
  expect(nameOffset(Focus.create(textBlock, 5)!.down())).toBe("text:5");

  expect(nameOffset(Focus.create(textBlock, 6)!.down())).toBe("text:1");
  expect(nameOffset(Focus.create(textBlock, 8)!.down())).toBe("text:3");
  expect(nameOffset(Focus.create(textBlock, 10)!.down())).toBe("text:5");
  expect(nameOffset(Focus.create(textBlock, 11)!.down())).toBe("text:5");
});
