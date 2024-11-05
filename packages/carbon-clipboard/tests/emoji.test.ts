import { test } from "vitest";
import { parseEmoji } from "../src/parser/emoji";

test("parse regex", () => {
  const tree = parseEmoji(`parse emoji one 😊 two 😊 three 😊`);

  console.log(JSON.stringify(tree, null, 2));
});
