import { test } from "vitest";
import { node, section, text, title } from "@emrgen/carbon-blocks";

test("put the pin at the start of inline", () => {
  const json = section([
    title([node("bold", [node("italic", [text("01234")])]), text("5678")]),
  ]);
  // const app = createCarbon(json);
  //
  // printNode(app.content);
  //
  // const pin = Pin.toStartOf(app.content);
  //
  // const at2 = pin?.moveBy(2);
  // expect(at2?.offset).toBe(2);
  //
  // const at3 = pin?.moveBy(3);
  // expect(at3?.offset).toBe(3);
  //
  // const at5 = pin?.moveBy(5);
  // expect(at5?.offset).toBe(5);
  //
  // const at6 = pin?.moveBy(6)?.down();
  // expect(at6?.offset).toBe(1);
  //
  // const at7 = pin?.moveBy(7)?.down();
  // expect(at7?.offset).toBe(2);
});
