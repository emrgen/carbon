import { expect, test } from "vitest";
import { Promised } from "../src/Promised";

test("test promised await", async (t) => {
  const a = await Promised.create<number>((resolve, reject) => {
    setTimeout(() => {
      resolve(42);
    }, 100);
  });

  await expect(a).toBe(42);
});

test("test promised fulfilled", async (t) => {
  const a = Promised.create<number>((resolve, reject) => {
    setTimeout(() => {
      resolve(42);
    }, 2);
  });

  a.fulfilled(100);

  await expect(await a).toBe(100);
});

test("test promised rejected", async (t) => {
  const a = Promised.create<number>((resolve, reject) => {
    setTimeout(() => {
      reject(new Error("Test error"));
    }, 2);
  });

  a.rejected(new Error("Rejected manually"));

  await expect(a).rejects.toThrowError("Rejected manually");
});
