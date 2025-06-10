import { expect, test } from "vitest";
import { Cell } from "../src/index";

test("30. parse Literal", async (t) => {
  const cell = Cell.parse(`x = 10`, {
    id: "x1",
    name: "x",
  });
  expect(cell).toBeDefined();
  expect(cell?.id).toBe("x1");
  expect(cell?.name).toBe("x");
  expect(cell?.dependencies).toEqual([]);
  expect(cell?.definition()).toBe(10);
});

test("31. parse Identifier", async (t) => {
  const cell = Cell.parse(`x = y`, { name: "x", id: "x2" });
  expect(cell).toBeDefined();
  expect(cell?.id).toBe("x2");
  expect(cell?.name).toBe("x");
  expect(cell?.dependencies).toEqual(["y"]);
});

test("32. parse BinaryExpression", async (t) => {
  const cell = Cell.parse(`x = y + z`, { name: "x", id: "x3" });
  expect(cell).toBeDefined();
  expect(cell?.id).toBe("x3");
  expect(cell?.name).toBe("x");
  expect(cell?.dependencies).toEqual(["y", "z"]);
});

test("33. parse CallExpression", async (t) => {
  const cell = Cell.parse(`x = foo(y, z)`, { name: "x", id: "x4" });
  expect(cell).toBeDefined();
  expect(cell?.id).toBe("x4");
  expect(cell?.name).toBe("x");
  expect(cell?.dependencies).toEqual(["foo", "y", "z"]);
});

test("34. parse FunctionExpression", async (t) => {
  const cell = Cell.parse(`x = function(y, z) { return y + z; }`, { name: "x", id: "x5" });
  expect(cell).toBeDefined();
  expect(cell?.id).toBe("x5");
  expect(cell?.name).toBe("x");
  expect(cell?.dependencies).toEqual([]);
});

test("35. parse ArrowFunctionExpression", async (t) => {
  const cell = Cell.parse(`x = (y, z) => y + z`, { name: "x", id: "x6" });
  expect(cell).toBeDefined();
  expect(cell?.id).toBe("x6");
  expect(cell?.name).toBe("x");
  expect(cell?.dependencies).toEqual([]);
});

test("36. parse ArrayExpression", async (t) => {
  const cell = Cell.parse(`x = [y, z]`, { name: "x", id: "x7" });
  expect(cell).toBeDefined();
  expect(cell?.id).toBe("x7");
  expect(cell?.name).toBe("x");
  expect(cell?.dependencies).toEqual(["y", "z"]);
});

test("37. parse ObjectExpression", async (t) => {
  const cell = Cell.parse(`{ const x = { a: y, b: z }}`, { name: "x", id: "x8" });
  expect(cell).toBeDefined();
  expect(cell?.id).toBe("x8");
  expect(cell?.name).toBe("x");
  expect(cell?.dependencies).toEqual(["y", "z"]);
});

test("38. parse TemplateLiteral", async (t) => {
  const cell = Cell.parse(`x = \`Hello, \${y}!\``, { name: "x", id: "x9" });
  expect(cell).toBeDefined();
  expect(cell?.id).toBe("x9");
  expect(cell?.name).toBe("x");
  expect(cell?.dependencies).toEqual(["y"]);
});

test("39. parse ConditionalExpression", async (t) => {
  const cell = Cell.parse(`x = y ? z : w`, { name: "x", id: "x10" });
  expect(cell).toBeDefined();
  expect(cell?.id).toBe("x10");
  expect(cell?.name).toBe("x");
  expect(cell?.dependencies).toEqual(["y", "z", "w"]);
});

test("40. parse LogicalExpression", async (t) => {
  const cell = Cell.parse(`x = y && z`, { name: "x", id: "x11" });
  expect(cell).toBeDefined();
  expect(cell?.id).toBe("x11");
  expect(cell?.name).toBe("x");
  expect(cell?.dependencies).toEqual(["y", "z"]);
});

test("41. parse UnaryExpression", async (t) => {
  const cell = Cell.parse(`x = !y`, { name: "x", id: "x12" });
  expect(cell).toBeDefined();
  expect(cell?.id).toBe("x12");
  expect(cell?.name).toBe("x");
  expect(cell?.dependencies).toEqual(["y"]);
});

test("42. parse UpdateExpression", async (t) => {
  const cell = Cell.parse(`x = ++y`, { name: "x", id: "x13" });
  expect(cell).toBeDefined();
  expect(cell?.id).toBe("x13");
  expect(cell?.name).toBe("x");
  expect(cell?.dependencies).toEqual([]);
  expect(() => cell?.definition()).toThrowError("Assignment to constant variable y");
});

test("43. parse MemberExpression", async (t) => {
  const cell = Cell.parse(`x = y.z`, { name: "x", id: "x14" });
  expect(cell).toBeDefined();
  expect(cell?.id).toBe("x14");
  expect(cell?.name).toBe("x");
  expect(cell?.dependencies).toEqual(["y"]);
  expect(() => cell?.definition()).toThrowError();
});

test("44. parse ChainExpression", async (t) => {
  const cell = Cell.parse(`x = y?.z`, { name: "x", id: "x15" });
  expect(cell).toBeDefined();
  expect(cell?.id).toBe("x15");
  expect(cell?.name).toBe("x");
  expect(cell?.dependencies).toEqual(["y"]);
});

test("45. parse SequenceExpression", async (t) => {
  const cell = Cell.parse(`{let x = (y, z); x + 1}`, { name: "x", id: "x16" });
  expect(cell).toBeDefined();
  expect(cell?.id).toBe("x16");
  expect(cell?.name).toBe("x");
  expect(cell?.dependencies).toEqual(["y", "z"]);
});

test("46. parse TemplateElement", async (t) => {
  const cell = Cell.parse(`x = \`Hello, world!\``, { name: "x", id: "x17" });
  expect(cell).toBeDefined();
  expect(cell?.id).toBe("x17");
  expect(cell?.name).toBe("x");
  expect(cell?.dependencies).toEqual([]);
});

test("47. parse Literal with comments", async (t) => {
  const cell = Cell.parse(`x = 10; // This is a comment`, { name: "x", id: "x18" });
  expect(cell).toBeDefined();
  expect(cell?.id).toBe("x18");
  expect(cell?.name).toBe("x");
  expect(cell?.dependencies).toEqual([]);
  expect(cell?.definition()).toBe(10);
});

test("48. parse Identifier with comments", async (t) => {
  const cell = Cell.parse(`x = y; // This is a comment`, { name: "x", id: "x19" });
  expect(cell).toBeDefined();
  expect(cell?.id).toBe("x19");
  expect(cell?.name).toBe("x");
  expect(cell?.dependencies).toEqual(["y"]);
});

test("49. parse BinaryExpression with comments", async (t) => {
  const cell = Cell.parse(`x = y + z; // This is a comment`, { name: "x", id: "x20" });
  expect(cell).toBeDefined();
  expect(cell?.id).toBe("x20");
  expect(cell?.name).toBe("x");
  expect(cell?.dependencies).toEqual(["y", "z"]);
});

test("50. parse CallExpression with comments", async (t) => {
  const cell = Cell.parse(`x = foo(y, z); // This is a comment`, { name: "x", id: "x21" });
  expect(cell).toBeDefined();
  expect(cell?.id).toBe("x21");
  expect(cell?.name).toBe("x");
  expect(cell?.dependencies).toEqual(["foo", "y", "z"]);
});

test("51. parse FunctionExpression with comments", async (t) => {
  const cell = Cell.parse(`x = function(y, z) { return y + z; }; // This is a comment`, {
    name: "x",
    id: "x22",
  });
  expect(cell).toBeDefined();
  expect(cell?.id).toBe("x22");
  expect(cell?.name).toBe("x");
  expect(cell?.dependencies).toEqual([]);
});

test("52. parse ArrowFunctionExpression with comments", async (t) => {
  const cell = Cell.parse(`x = (y, z) => y + z // This is a comment`, {
    name: "x",
    id: "x23",
  });
  expect(cell).toBeDefined();
  expect(cell?.id).toBe("x23");
  expect(cell?.name).toBe("x");
  expect(cell?.dependencies).toEqual([]);
});

test("53. parse ArrayExpression with comments", async (t) => {
  const cell = Cell.parse(`x = [y, z]; // This is a comment`, { name: "x", id: "x24" });
  expect(cell).toBeDefined();
  expect(cell?.id).toBe("x24");
  expect(cell?.name).toBe("x");
  expect(cell?.dependencies).toEqual(["y", "z"]);
});

test("57. parse mutable variable", async (t) => {
  const cell = Cell.parse(`mutable x = 0`, {
    id: "x28",
  });
  expect(cell).toBeDefined();
  expect(cell?.id).toBe("x28");
  expect(cell?.name).toBe("x");
  expect(cell?.dependencies).toEqual([]);
  expect(cell?.definition()).toBe(0);
  expect(cell?.mutable).toBe(true);
});

test("58. parse mutable variable", async (t) => {
  const cell = Cell.parse(`viewof x = 10`, {
    id: "x29",
  });
  expect(cell).toBeDefined();
  expect(cell?.id).toBe("x29");
  expect(cell?.name).toBe("__view__1");
  expect(cell?.dependencies).toEqual([]);
  expect(cell?.definition()).toBe(10);
  expect(cell?.view).toBe(true);
});
