import { test } from "vitest";
import { expect } from "vitest";
import { createCarbon } from "./utils";
import { Step, TitleNode } from "@emrgen/carbon-core";
import { Focus } from "@emrgen/carbon-core";
import { printNode } from "@emrgen/carbon-core";
import { printSteps } from "@emrgen/carbon-core";
import { mention } from "@emrgen/carbon-blocks";

test("text block split", () => {
  const carbon = createCarbon();
  const title = carbon.content.type.schema.type("title")?.default();
  const schema = carbon.content.type.schema;
  const tb = TitleNode.from(title!);
  const tb1 = tb.insert(1, schema.text("hello")!);

  // console.log(tb1.node.toJSON());
  // console.log(tb1.mapStep(3));

  let blocks = tb1.split(3);
  // console.log(blocks[0].node.toJSON());
  // console.log(blocks[1].node.toJSON());
});

test("text block insert", () => {
  const carbon = createCarbon();
  const title = carbon.content.type.schema.type("title")?.default();
  const schema = carbon.content.type.schema;
  const tb = TitleNode.from(title!);
  const tb1 = tb.insert(1, schema.text("hello")!);

  // console.log(tb1.node.toJSON());
  // console.log(tb1.mapStep(2));

  const tb2 = tb1.insert(1, schema.text("world")!);
  // console.log(tb2.node.toJSON());
  // console.log(tb2.mapStep(1));
});

test("text block insert within inline", () => {
  const carbon = createCarbon();
  const title = carbon.content.type.schema.type("title")?.default();
  const schema = carbon.content.type.schema;
  const tb = TitleNode.from(title!).replaceContent([schema.text("hello")!]);

  const tb2 = tb.insert(4, schema.text("world")!);

  // @ts-ignore
  const node = tb2.node;
  expect(node.size).toBe(3);
  expect(node.child(0)!.textContent).toBe("he");
  expect(node.child(1)!.textContent).toBe("world");
  expect(node.child(2)!.textContent).toBe("llo");

  printSteps(tb.node);
  printSteps(tb2.node);

  expect(tb.mapStep(5)).toBe(5);
  expect(tb2.mapStep(5)).toBe(14);
  // expect(tb2.mapStep(7)).toBe(14);
  // expect(tb2.mapStep(4)).toBe(4);
});

test("text block remove", () => {
  const carbon = createCarbon();
  const title = carbon.content.type.schema.type("title")?.default();
  const schema = carbon.content.type.schema;
  const tb = TitleNode.from(title!);
  const tb1 = tb.insert(1, schema.text("hello")!);
  const tb2 = tb1.insert(7, schema.text("world")!);

  expect(tb2.textContent).toBe("helloworld");
  const tb3 = tb2.remove(4, 11);

  expect(tb3.textContent).toBe("herld");
  expect(tb3.node.size).toBe(2);
  expect(tb3.normalize().node.size).toBe(1);

  // delete the `world`
  const tb4 = tb2.remove(9, 14);
  expect(tb4.textContent).toBe("hello");
  console.log(tb4.textContent);

  const focus = Step.create(tb4.node, 0).focus();
  const s1 = Focus.toStartOf(tb4.node)?.moveBy(focus?.offset!);
  expect(s1?.offset).toBe(5);
});

test("text block insert between mention and text", () => {
  const carbon = createCarbon();
  const title = carbon.content.type.schema.type("title")?.default();
  const schema = carbon.content.type.schema;
  const tb = TitleNode.from(title!);

  const tb1 = tb
    .insert(1, schema.node("mention", mention("hello"))!)
    ?.insert(4, schema.text("123")!)
    ?.insert(8, schema.node("mention", mention("hello"))!);

  printNode(tb1.node);

  console.log("--------------");
  tb1?.insert(4, schema.text("0")!);

  printNode(tb1.node);
});
