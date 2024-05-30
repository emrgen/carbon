import { expect, test } from "vitest";
import { CodeTitle } from "../src/plugins/CodeTitle";

test("tokenize", () => {
  const text = `const a = 1;`;
  const tokens = CodeTitle.tokenize(text, "javascript");
  expect(tokens).toEqual([
    { content: "const", type: "keyword", start: 0, end: 5 },
    { content: " a ", type: "text", start: 5, end: 8 },
    { content: "=", type: "operator", start: 8, end: 9 },
    { content: " ", type: "whitespace", start: 9, end: 10 },
    { content: "1", type: "number", start: 10, end: 11 },
    { content: ";", type: "punctuation", start: 11, end: 12 },
  ]);
});

test("tokenize newline", () => {
  const text = `const a = 1;\nconst b = 2;`;
  const tokens = CodeTitle.tokenize(text, "javascript");
  expect(tokens).toEqual([
    { content: "const", type: "keyword", start: 0, end: 5 },
    { content: " a ", type: "text", start: 5, end: 8 },
    { content: "=", type: "operator", start: 8, end: 9 },
    { content: " ", type: "whitespace", start: 9, end: 10 },
    { content: "1", type: "number", start: 10, end: 11 },
    { content: ";", type: "punctuation", start: 11, end: 12 },
    { content: "\n", type: "whitespace", start: 12, end: 13 },
    { content: "const", type: "keyword", start: 13, end: 18 },
    { content: " b ", type: "text", start: 18, end: 21 },
    { content: "=", type: "operator", start: 21, end: 22 },
    { content: " ", type: "whitespace", start: 22, end: 23 },
    { content: "2", type: "number", start: 23, end: 24 },
    { content: ";", type: "punctuation", start: 24, end: 25 },
  ]);
});

test("tokenize function", () => {
  const text = `function add(a, b) {\n  return a + b;\n}`;
  const tokens = CodeTitle.tokenize(text, "javascript");
  expect(tokens).toEqual([
    { content: "function", type: "keyword", start: 0, end: 8 },
    { content: " ", type: "whitespace", start: 8, end: 9 },
    { content: "add", type: "function", start: 8, end: 12 },
    { content: "(", type: "punctuation", start: 12, end: 13 },
    { content: "a", type: "text", start: 13, end: 14 },
    { content: ",", type: "punctuation", start: 14, end: 15 },
    { content: " b", type: "text", start: 16, end: 19 },
    { content: ")", type: "punctuation", start: 19, end: 20 },
    { content: " {", type: "punctuation", start: 20, end: 22 },
    { content: "\n  ", type: "whitespace", start: 22, end: 25 },
    { content: "return", type: "keyword", start: 25, end: 31 },
    { content: " a ", type: "text", start: 31, end: 34 },
    { content: "+", type: "operator", start: 34, end: 35 },
    { content: " b", type: "text", start: 35, end: 38 },
    { content: ";", type: "punctuation", start: 38, end: 39 },
    { content: "\n", type: "whitespace", start: 39, end: 40 },
    { content: "}", type: "punctuation", start: 40, end: 41 },
  ]);
});
