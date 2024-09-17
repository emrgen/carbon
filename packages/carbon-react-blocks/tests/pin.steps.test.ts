import { test } from "vitest";
import { section, text, title } from "@emrgen/carbon-blocks";
import { createCarbon } from "./utils";

test("pin steps", () => {
  const json = section([title([text("Pin Steps")])]);
  const app = createCarbon(json);
  const { content } = app;
  // Pin.
});
