import { printNode, printSteps, TitleNode } from "@emrgen/carbon-core";
import { expect, test } from "vitest";
import { createCarbon } from "./utils";

test("title block split", () => {
  const carbon = createCarbon();
  const title = carbon.content.type.schema.type("title")?.default();
  const schema = carbon.content.type.schema;
  const tb = TitleNode.from(title!).replaceContent([
    schema.text("hello")!,
    schema.text("world")!,
  ]);
  // printNode(tb.node);

  // split at start
  expect(tb.splitInp(0).node.children.length).toBe(2);
  expect(tb.splitInp(1).node.children.length).toBe(2);
  expect(tb.splitInp(2).node.children.length).toBe(2);
  // printSteps(tb.node);

  expect(tb.splitInp(7).node.children.length).toBe(2);
  expect(tb.splitInp(8).node.children.length).toBe(2);
  expect(tb.splitInp(9).node.children.length).toBe(2);

  // split at end
  expect(tb.splitInp(14).node.children.length).toBe(2);
  expect(tb.splitInp(15).node.children.length).toBe(2);
  expect(tb.splitInp(16).node.children.length).toBe(2);

  // split in middle
  const tb4 = tb.splitInp(4);
  expect(tb4.node.children.length).toBe(3);
  // printNode(tb4.node);
  // printSteps(tb4.node);

  // console.log(tb4.startMapper);
  expect(tb4.mapStep(0)).toBe(0);
  expect(tb4.mapStep(4)).toBe(4);
  expect(tb4.mapStep(5)).toBe(7);
  expect(tb4.mapStep(6)).toBe(8);
  expect(tb4.mapStep(7)).toBe(9);
  expect(tb4.mapStep(9)).toBe(11);

  expect(tb4.mapStep(-1)).toBe(-1);
  expect(tb4.mapStep(-5)).toBe(-5);
  expect(tb4.mapStep(-11)).toBe(-11);
  expect(tb4.mapStep(-12)).toBe(-12);
  expect(tb4.mapStep(-13)).toBe(-15);
  expect(tb4.mapStep(-14)).toBe(-16);
});

test("title block insert text", () => {
  const carbon = createCarbon();
  const title = carbon.content.type.schema.type("title")?.default();
  const schema = carbon.content.type.schema;
  const tb = TitleNode.from(title!).replaceContent([
    schema.text("hello")!,
    schema.text("world")!,
  ]);
  // printNode(tb.node);
  printSteps(tb.node);

  // insert at start
  const tb1 = tb.insertInp(0, schema.text("foo")!);
  expect(tb1.node.children.length).toBe(3);
  // printNode(tb1.node);
  // printSteps(tb1.node);

  expect(tb1.mapStep(0)).toBe(0);
  expect(tb1.mapStep(1)).toBe(1);
  expect(tb1.mapStep(2)).toBe(7);

  expect(tb1.mapStep(0)).toBe(0);
  expect(tb1.mapStep(-1)).toBe(-1);
  expect(tb1.mapStep(-2)).toBe(-2);

  // insert at end
  const tb2 = tb.insertInp(15, schema.text("foo")!);
  expect(tb2.node.children.length).toBe(3);
  // printNode(tb2.node);
  // printSteps(tb2.node);

  expect(tb2.mapStep(0)).toBe(0);
  expect(tb2.mapStep(1)).toBe(1);
  expect(tb2.mapStep(2)).toBe(2);

  expect(tb2.mapStep(-1)).toBe(-1);
  expect(tb2.mapStep(-2)).toBe(-7);
  expect(tb2.mapStep(-3)).toBe(-8);

  // insert in middle
  const tb3 = tb.insertInp(4, schema.text("foo")!);
  expect(tb3.node.children.length).toBe(4);
  printNode(tb3.node);
  printSteps(tb3.node);

  expect(tb3.mapStep(2)).toBe(2);
  expect(tb3.mapStep(4)).toBe(4);
  expect(tb3.mapStep(5)).toBe(12);

  expect(tb3.mapStep(-12)).toBe(-12);
  expect(tb3.mapStep(-13)).toBe(-20);
  expect(tb3.mapStep(-14)).toBe(-21);
});

test("title block remove text", () => {
  const carbon = createCarbon();
  const title = carbon.content.type.schema.type("title")?.default();
  const schema = carbon.content.type.schema;
  const tb = TitleNode.from(title!).replaceContent([
    schema.text("hello")!,
    schema.text("world")!,
  ]);

  printSteps(tb.node);

  // const tb35 = tb.splitInp(5).splitInp(3);
  //
  // printNode(tb35.node);
  // printSteps(tb35.node);

  // console.log(tb35.mapStep(-11));
  // console.log(tb35.mapStep(-13));

  // printNode(tb.node);
  printSteps(tb.node);

  const t23 = tb.removeInp(2, 3);
  expect(t23.mapStep(-13)).toBe(-13);

  const t35 = tb.removeInp(3, 5);
  printSteps(t35.node);
  expect(t35.mapStep(-11)).toBe(-11);
});
