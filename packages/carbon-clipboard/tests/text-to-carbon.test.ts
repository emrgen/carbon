import { test } from "vitest";
import { fixContentMatch, parseText } from "../src/parser/text";
import { createCarbon } from "./utils";
import { printNode } from "@emrgen/carbon-core";

test("parse paragraph to carbon", () => {
  const content = `- quote
     1. hello`;
  const res = parseText(content);
  const carbon = createCarbon();
  const nodes = res.map((n) => carbon.schema.nodeFromJSON(n));
  const slice = carbon.schema.type("slice").create(nodes)!;
  const readySlice = fixContentMatch(carbon.schema, slice);

  printNode(readySlice);
});
