import { test } from "vitest";
import { expect } from "vitest";
import { createCarbon } from "./utils";
import { TextBlock } from "@emrgen/carbon-core/src/core/TextBlock";

// test("text block split", () => {
//   const carbon = createCarbon();
//   const title = carbon.content.type.schema.type("title")?.default();
//   const schema = carbon.content.type.schema;
//   const tb = TextBlock.from(title!);
//   const tb1 = tb.insert(1, schema.text("hello")!);
//
//   // console.log(tb1.node.toJSON());
//   // console.log(tb1.mapStep(3));
//
//   let blocks = tb1.split(3);
//   console.log(blocks[0].node.toJSON());
//   console.log(blocks[1].node.toJSON());
// });

// test("text block insert", () => {
//   const carbon = createCarbon();
//   const title = carbon.content.type.schema.type("title")?.default();
//   const schema = carbon.content.type.schema;
//   const tb = TextBlock.from(title!);
//   const tb1 = tb.insert(1, schema.text("hello")!);
//
//   console.log(tb1.node.toJSON());
//   console.log(tb1.mapStep(2));
//
//   const tb2 = tb1.insert(1, schema.text("world")!);
//   console.log(tb2.node.toJSON());
//   console.log(tb2.mapStep(1));
// });

test("text block insert within inline", () => {
  const carbon = createCarbon();
  const title = carbon.content.type.schema.type("title")?.default();
  const schema = carbon.content.type.schema;
  const tb = TextBlock.from(title!);
  const tb1 = tb.insert(1, schema.text("hello")!);
  const tb2 = tb1.insert(4, schema.text("world")!);

  // @ts-ignore
  const node = tb2.node;
  expect(node.size).toBe(3);
  expect(node.child(0)!.textContent).toBe("he");
  expect(node.child(1)!.textContent).toBe("world");
  expect(node.child(2)!.textContent).toBe("llo");

  expect(tb2.mapStep(5)).toBe(12);
  expect(tb2.mapStep(7)).toBe(14);
  expect(tb2.mapStep(4)).toBe(4);
});
