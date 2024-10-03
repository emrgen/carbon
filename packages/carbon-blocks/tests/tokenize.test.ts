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
  console.log(tokens);
  expect(tokens).toEqual([
    { content: "function", type: "keyword", start: 0, end: 8 },
    { content: " ", type: "whitespace", start: 8, end: 9 },
    { content: "add", type: "function", start: 9, end: 12 },
    { content: "(", type: "punctuation", start: 12, end: 13 },
    {
      content: "a,[object Object], b",
      type: "parameter",
      start: 13,
      end: 16,
    },
    { content: ")", type: "punctuation", start: 16, end: 17 },
    { content: " ", type: "whitespace", start: 17, end: 18 },
    { content: "{", type: "punctuation", start: 18, end: 19 },
    { content: "\n  ", type: "whitespace", start: 19, end: 22 },
    { content: "return", type: "keyword", start: 22, end: 28 },
    { content: " a ", type: "text", start: 28, end: 31 },
    { content: "+", type: "operator", start: 31, end: 32 },
    { content: " b", type: "text", start: 32, end: 34 },
    { content: ";", type: "punctuation", start: 34, end: 35 },
    { content: "\n", type: "whitespace", start: 35, end: 36 },
    { content: "}", type: "punctuation", start: 36, end: 37 },
  ]);
});
