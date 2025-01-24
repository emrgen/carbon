import { expect, test } from "vitest";
import { Promix } from "../src/Promix";

test("test promix error", async (t) => {
  const a = new Promix((_, n) => {});
  a.rejected("error");

  expect(
    await a.catch((e) => {
      return e;
    }),
  ).toBe("error");
});

test("");