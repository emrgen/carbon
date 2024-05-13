import { test } from "vitest";
import { fixContentMatch, parseText } from "../src/parser/text";
import { createCarbon } from "./utils";
import { printNode } from "@emrgen/carbon-core";
import { NodeHtmlMarkdown } from "node-html-markdown";

const parseTextToCarbon = (text: string) => {
  const res = parseText(text);

  console.log(JSON.stringify(res, null, 2));

  const carbon = createCarbon();
  const nodes = res.map((n) => carbon.schema.nodeFromJSON(n));
  const slice = carbon.schema.type("slice").create(nodes)!;
  const readySlice = fixContentMatch(carbon.schema, slice);

  return readySlice[0];
};

test("parse paragraph to carbon", () => {
  const content = `![medium](https://medium.com/)`;
  const slice = parseTextToCarbon(content);
  printNode(slice);
});

test("parse bold to carbon", () => {
  const content = `hel**lo** there`;
  const slice = parseTextToCarbon(content);
  printNode(slice);
});

test("parse long blockquote to carbon", () => {
  const content = `> * [x]  paragraph
> * [x]  space
> * [x]  code block
> * [x]  header
> * [x]  link
> * [x]  bold
> * [x]  italic
> * [x]  underline
> * [x]  strike through
> * [x]  text color
> * [x]  background color
> * [x]  block quote
> * [x]  list
> * [x]  divider`;
  const slice = parseTextToCarbon(content);
  printNode(slice);
});

test("parse blockquote to carbon", () => {
  const content = `> ## hel**lo** there 
  hello`;
  const slice = parseTextToCarbon(content);
  printNode(slice);
});

test("parse blockquote html to carbon", () => {
  const content = `<h1>Heading 1</h1><hr/><h2>Heading 2</h2>`;
  const slice = parseTextToCarbon(NodeHtmlMarkdown.translate(content));
  printNode(slice);
});
