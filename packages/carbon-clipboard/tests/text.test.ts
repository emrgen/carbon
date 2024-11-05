import { expect, test } from "vitest";
import { node, paragraph, parseText, text, title } from "../src/parser/text";

test("parse plain space", () => {
  const content = "a \n\n b ";
  const res = parseText(content);
  expect(res).toMatchObject([
    paragraph([title([text("a ")])]),
    paragraph([title([])]),
    paragraph([title([text(" b ")])]),
  ]);
});

test("parse header", () => {
  const content = "# hello";
  const res = parseText(content);
  const expected = node("h1", [title([text("hello")])]);

  expect(res).toMatchObject([expected]);
});

test("parse paragraph", () => {
  const content = "hello";
  const res = parseText(content);
  expect(res).toMatchObject([paragraph([title([text("hello")])])]);
});

test("parse code  ", () => {
  const content = "```js\nconst fn = () => hi\n```";
  const res = parseText(content);
  expect(res).toStrictEqual([
    node("code", [title([text("const fn = () => hi")])], {
      "remote/state/code/lang": "js",
    }),
  ]);
});

// parse br
test("parse paragraph", () => {
  const content = "`const` fn = () => *hi*";
  const actual = parseText(content);

  expect(actual).toMatchObject([
    paragraph([
      title([
        node("codespan", [text("const")]),
        text(" fn = () => "),
        node("italic", [text("hi")]),
      ]),
    ]),
  ]);
});

test("parse bullet list", () => {
  const content = `- a
 - b
     - c
     - d   
`;
  const res = parseText(content);

  expect(res).toMatchObject([
    node("bulletList", [title([text("a")])]),
    node("bulletList", [
      title([text("b")]),
      node("bulletList", [title([text("c")])]),
      node("bulletList", [title([text("d")])]),
    ]),
    paragraph([title([])]),
  ]);
});

test("parse ordered list", () => {
  const content = `1. a
 2. b
     3. c
     4. d   
`;
  const res = parseText(content);

  expect(res).toMatchObject([
    node("numberList", [title([text("a")])]),
    node("numberList", [
      title([text("b")]),
      node("numberList", [title([text("c")])]),
      node("numberList", [title([text("d")])]),
    ]),
    paragraph([title([])]),
  ]);
});

test("parse nested bullet list", () => {
  const content = `* a
   * b
   * c  
   1. d`;
  const res = parseText(content);

  expect(res).toMatchObject([
    node("bulletList", [
      title([text("a")]),
      node("bulletList", [title([text("b")])]),
      node("bulletList", [title([text("c")])]),
      node("numberList", [title([text("d")])]),
    ]),
  ]);
});

test("parse mixed list", () => {
  const content = `- a
 1. b
     - c
 2. d
`;
  const res = parseText(content);
  expect(res).toMatchObject([
    node("bulletList", [title([text("a")])]),
    node("numberList", [
      title([text("b")]),
      node("bulletList", [title([text("c")])]),
    ]),
    node("numberList", [title([text("d")])]),
    // paragraph([title([])]),
  ]);
});

test("parse checkbox", () => {
  const content = `- [ ] a
- [x] b
    - [x] c 
`;
  const res = parseText(content);
  expect(res).toMatchObject([
    node("checkList", [title([text("a")])]),
    node("checkList", [
      title([text("b")]),
      node("checkList", [title([text("c")])]),
    ]),
    paragraph([title([])]),
  ]);
});

test("parse link", () => {
  const content = "[he**llo**](https://google.com)";
  const res = parseText(content);

  expect(res).toMatchObject([
    paragraph([
      title([
        node("link", [text("he"), node("bold", [text("llo")])], {
          "remote/state/link/href": "https://google.com",
        }),
      ]),
    ]),
  ]);
});

test("parse italic", () => {
  const content = "he*llo* w**or**ld";
  const res = parseText(content);

  expect(res).toMatchObject([
    paragraph([
      title([
        text("he"),
        node("italic", [text("llo")]),
        text(" w"),
        node("bold", [text("or")]),
        text("ld"),
      ]),
    ]),
  ]);
});

test("parse blockquote", () => {
  const content = `> hello world`;
  const actual = parseText(content);
  expect(actual).toMatchObject([
    node("quote", [paragraph([title([text("hello world")])])]),
  ]);
});

test("parse image", () => {
  const content = `![title](https://local.image) ![title](https://remote.image)`;
  const actual = parseText(content);
  expect(actual).toMatchObject([
    paragraph([
      node("image", [], {
        "remote/state/image/src": "https://local.image",
      }),
      node("image", [], {
        "remote/state/image/src": "https://remote.image",
      }),
    ]),
  ]);
});

test("parse html", () => {
  const content = `# Hello \n\n<h2>Heading 2</h2>`;
  const actual = parseText(content);
  expect(actual).toMatchObject([
    node("h1", [title([text("Hello")])]),
    paragraph([title([text("<h2>Heading 2</h2>")])]),
  ]);
});

test("parse codespan", () => {
  const content = `codespan \`console.log('codespan')\``;
  const actual = parseText(content);
  expect(actual).toMatchObject([
    paragraph([
      title([
        text("codespan "),
        node("codespan", [text("console.log('codespan')")]),
      ]),
    ]),
  ]);
});
