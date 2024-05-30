import { expect, test } from "vitest";
import { diffArrays } from "diff";
import { isNumber, isString } from "lodash";
import { mergeDiff } from "../src/plugins/CodeTitle";

test("check diff comparator", () => {
  const a = [1, 2, 3];
  const b = [1, 4, 3];

  const diff = diffArrays(a, b);

  const result = mergeDiff(diff, a, b);
  expect(result).toEqual([1, 4, 3]);
});

test("check diff comparator for different types", () => {
  const a = [1, 2, 3];
  const b = ["1-1", "4-1", "3-1"];

  const comparator = (a: string | number, b: string | number) => {
    if (isString(a) && isNumber(b)) {
      return a.split("-")[0] == String(b);
    }

    if (isNumber(a) && isString(b)) {
      return String(a) == b.split("-")[0];
    }

    throw new Error("Invalid type");
  };

  const diff = diffArrays(a, b, {
    comparator: comparator,
  });

  const result = mergeDiff(diff, a, b);
  expect(result).toEqual([1, "4-1", 3]);
});

test("character object diff", () => {
  const a = [
    { id: 1, name: "A" },
    { id: 2, name: "B" },
    { id: 3, name: "C" },
    { id: 6, name: "E" },
  ];

  const b = [
    { id: 5, name: "d" },
    { id: 1, name: "a" },
    { id: 4, name: "d" },
    { id: 3, name: "c" },
    { id: 6, name: "e" },
  ];

  const comparator = (a, b) => {
    return a.id === b.id;
  };

  const diff = diffArrays(a, b, {
    comparator: comparator,
  });

  console.log(JSON.stringify(diff, null));

  const result = mergeDiff(diff, a, b);
  expect(result).toEqual([
    { id: 5, name: "d" },
    { id: 1, name: "A" },
    { id: 4, name: "d" },
    { id: 3, name: "C" },
    { id: 6, name: "E" },
  ]);
});
