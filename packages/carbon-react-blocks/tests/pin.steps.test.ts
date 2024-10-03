import { expect, test } from "vitest";
import { section, title } from "@emrgen/carbon-blocks";
import { text } from "@emrgen/carbon-blocks";
import { node } from "@emrgen/carbon-blocks";
import { createCarbon } from "./utils";
import { nameOffset } from "./utils";
import { Step } from "@emrgen/carbon-core";

const json = node("callout", [
  title([text("abc")]),
  section([title([text("def")])]),
]);
const app = createCarbon(json);

// printSteps(app.content);

test("pin step forwards ", () => {
  const pos = Step.toStartOf(app.content);

  expect(nameOffset(pos)).toBe("callout:1");
  expect(nameOffset(pos.moveBy(0))).toBe("callout:1");
  expect(nameOffset(pos.moveBy(1))).toBe("callout:2");
  expect(nameOffset(pos.moveBy(5))).toBe("callout:6");
  expect(nameOffset(pos.moveBy(6))).toBe("callout:7");
  expect(nameOffset(pos.moveBy(7))).toBe("callout:8");
  expect(nameOffset(pos.moveBy(8))).toBe("callout:9");
  expect(nameOffset(pos.moveBy(12))).toBe("callout:13");
});

test("pin step forwards down", () => {
  const pos = Step.toStartOf(app.content);

  expect(nameOffset(pos)).toBe("callout:1");
  expect(nameOffset(pos.moveBy(0).down())).toBe("title:0");
  expect(nameOffset(pos.moveBy(1).down())).toBe("text:0");
  expect(nameOffset(pos.moveBy(2).down())).toBe("text:1");
  expect(nameOffset(pos.moveBy(3).down())).toBe("text:2");
  expect(nameOffset(pos.moveBy(4).down())).toBe("text:3");
  expect(nameOffset(pos.moveBy(5).down())).toBe("text:4");
  expect(nameOffset(pos.moveBy(6).down())).toBe("text:5");
  expect(nameOffset(pos.moveBy(7).down())).toBe("title:7");
  expect(nameOffset(pos.moveBy(8).down())).toBe("title:0");
  expect(nameOffset(pos.moveBy(9).down())).toBe("text:0");
  expect(nameOffset(pos.moveBy(10).down())).toBe("text:1");
  expect(nameOffset(pos.moveBy(13).down())).toBe("text:4");
  expect(nameOffset(pos.moveBy(14).down())).toBe("text:5");
  expect(nameOffset(pos.moveBy(15).down())).toBe("title:7");
  expect(nameOffset(pos.moveBy(16).down())).toBe("section:9");
  expect(nameOffset(pos.moveBy(17).down())).toBe("callout:18");
});

test("pin step backwards", () => {
  const pos = Step.toEndOf(app.content);
  expect(nameOffset(pos)).toBe("callout:17");
  expect(nameOffset(pos.moveBy(0))).toBe("callout:17");
  expect(nameOffset(pos.moveBy(-1))).toBe("callout:16");
  expect(nameOffset(pos.moveBy(-2))).toBe("callout:15");
  expect(nameOffset(pos.moveBy(-15))).toBe("callout:2");
  expect(nameOffset(pos.moveBy(-16))).toBe("callout:1");
  expect(nameOffset(pos.moveBy(-17))).toBe("callout:0");
});

test("pin step backwards down", () => {
  const pos = Step.toEndOf(app.content);
  expect(nameOffset(pos)).toBe("callout:17");
  expect(nameOffset(pos.moveBy(0).down())).toBe("section:9");
  expect(nameOffset(pos.moveBy(-1).down())).toBe("title:7");
  expect(nameOffset(pos.moveBy(-2).down())).toBe("text:5");
  expect(nameOffset(pos.moveBy(-3).down())).toBe("text:4");
  expect(nameOffset(pos.moveBy(-4).down())).toBe("text:3");
  expect(nameOffset(pos.moveBy(-5).down())).toBe("text:2");
  expect(nameOffset(pos.moveBy(-6).down())).toBe("text:1");
  expect(nameOffset(pos.moveBy(-7).down())).toBe("text:0");
  expect(nameOffset(pos.moveBy(-8).down())).toBe("title:0");
  expect(nameOffset(pos.moveBy(-9).down())).toBe("title:7");
  expect(nameOffset(pos.moveBy(-10).down())).toBe("text:5");
  expect(nameOffset(pos.moveBy(-12).down())).toBe("text:3");
  expect(nameOffset(pos.moveBy(-13).down())).toBe("text:2");
  expect(nameOffset(pos.moveBy(-14).down())).toBe("text:1");
  expect(nameOffset(pos.moveBy(-15).down())).toBe("text:0");
  expect(nameOffset(pos.moveBy(-16).down())).toBe("title:0");
  expect(nameOffset(pos.moveBy(-17).down())).toBe("callout:0");
});

test("pin step up", () => {
  const pos = Step.toEndOf(app.content);
  expect(nameOffset(pos)).toBe("callout:17");
  expect(nameOffset(pos.moveBy(0).up(isCallout))).toBe("callout:17");
  expect(nameOffset(pos.moveBy(-1).down().up(isCallout))).toBe("callout:16");
  expect(nameOffset(pos.moveBy(-2).down().up(isCallout))).toBe("callout:15");
  expect(nameOffset(pos.moveBy(-3).down().up(isCallout))).toBe("callout:14");
  expect(nameOffset(pos.moveBy(-4).down().up(isCallout))).toBe("callout:13");
  expect(nameOffset(pos.moveBy(-5).down().up(isCallout))).toBe("callout:12");
  expect(nameOffset(pos.moveBy(-6).down().up(isCallout))).toBe("callout:11");
  expect(nameOffset(pos.moveBy(-7).down().up(isCallout))).toBe("callout:10");
  expect(nameOffset(pos.moveBy(-8).down().up(isCallout))).toBe("callout:9");
  expect(nameOffset(pos.moveBy(-9).down().up(isCallout))).toBe("callout:8");
  expect(nameOffset(pos.moveBy(-10).down().up(isCallout))).toBe("callout:7");
  expect(nameOffset(pos.moveBy(-11).down().up(isCallout))).toBe("callout:6");
  expect(nameOffset(pos.moveBy(-12).down().up(isCallout))).toBe("callout:5");
  expect(nameOffset(pos.moveBy(-13).down().up(isCallout))).toBe("callout:4");
  expect(nameOffset(pos.moveBy(-14).down().up(isCallout))).toBe("callout:3");
  expect(nameOffset(pos.moveBy(-15).down().up(isCallout))).toBe("callout:2");
  expect(nameOffset(pos.moveBy(-16).down().up(isCallout))).toBe("callout:1");
  expect(nameOffset(pos.moveBy(-17).down().up(isCallout))).toBe("callout:0");
});

const isCallout = (n) => n.name === "callout";
