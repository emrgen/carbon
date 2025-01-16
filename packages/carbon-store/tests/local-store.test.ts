import { v4 as uuidv4 } from "uuid";
import { expect, test } from "vitest";
import { LocalStore } from "../src/LocalStore";

test("find the current affine from a shape", () => {
  const store = new LocalStore();
  const space = store.createSpace(uuidv4());
  expect(space).toBeDefined();

  const d1 = space.createDocument();
  expect(d1).toBeDefined();

  const d1Content1 = JSON.stringify({
    title: "Hello World",
    content: "This is a test",
  });
  d1.update("title", d1Content1);
  expect(d1.json()).toEqual(d1Content1);

  const d1Content2 = JSON.stringify({
    title: "Hello World",
    content: "This is updated",
  });
  d1.update("title", d1Content2);
  expect(d1.json()).toEqual(d1Content2);
});
