import { test } from "vitest";
import { fixContentMatch, parseText } from "../src/parser/text";
import { createCarbon } from "./utils";
import { printNode } from "@emrgen/carbon-core";

test("parse paragraph to carbon", () => {
  const content = `![medium](https://medium.com/)`;
  const res = parseText(content);

  // console.log(JSON.stringify(res, null, 2));

  const carbon = createCarbon();
  const nodes = res.map((n) => carbon.schema.nodeFromJSON(n));
  const slice = carbon.schema.type("slice").create(nodes)!;
  const readySlice = fixContentMatch(carbon.schema, slice);

  printNode(readySlice[0]);
});

test("parse bold to carbon", () => {
  const content = `hel**lo** there`;
  const res = parseText(content);

  const carbon = createCarbon();
  const nodes = res.map((n) => carbon.schema.nodeFromJSON(n));
  const slice = carbon.schema.type("slice").create(nodes)!;
  const readySlice = fixContentMatch(carbon.schema, slice);

  printNode(readySlice[0]);
});
