import { expect, test } from "vitest";
import { Content } from "../src/core/Content";
import { NodeData } from "@emrgen/carbon-core";

test("update node content", () => {
  const data: NodeData = {
    id: "root",
    name: "root",
    children: [
      {
        id: "0",
        name: "title",
        children: [
          {
            id: "1",
            name: "text",
            textContent: "hello",
          },
          {
            id: "2",
            name: "text",
            textContent: "world",
          },
        ],
      },
    ],
  };

  const node = Content.atPath(data, [0, 0]);
  expect(node?.textContent).toBe("hello");

  Content.insert(data, [0, 1], { id: "3", name: "text", textContent: "there" });
  const node2 = Content.atPath(data, [0]);
  expect(Content.textContent(node2!)).toBe("hellothereworld");

  Content.remove(data, [0, 1]);
  const node3 = Content.atPath(data, [0]);
  expect(Content.textContent(node3!)).toBe("helloworld");

  Content.insertText(data, [0, 0, 2], "human");
  const node4 = Content.atPath(data, [0]);
  expect(Content.textContent(node4!)).toBe("hehumanlloworld");
});
