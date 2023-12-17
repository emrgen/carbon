// sum.test.js
import { expect, test } from 'vitest'
import { JsonStore } from "../src/core/JsonStore";
import { NodeProps } from "../src/core/NodeProps";

test('set and get from json store', () => {
  const store = new JsonStore();
  store.set(["a", "b"], 1);
  store.set(["a", "c"], 2);
  store.set(["a", "b"], 3);
  expect(store.get(["a", "b"])).toBe(3);
  expect(store.get(["a", "c"])).toBe(2);

  store.set(["a", "b"], undefined);
  expect(store.get(["a", "b"])).toBe(undefined);
  expect(store.size).toBe(1);
})


test('set and get from json store using string path', () => {
  const store = new JsonStore();
  store.set("a/b", 1);
  store.set("a/c", 2);
  store.set("a/b", 3);
  expect(store.get("a/b")).toBe(3);
  expect(store.get("a/c")).toBe(2);

  store.set("a/b", undefined);
  expect(store.get("a/b")).toBe(undefined);
  expect(store.size).toBe(1);
});

test("get values by prefix", () => {
  const store = new JsonStore();
  store.set("a/b", 1);
  store.set("a/c", 2);
  // store.set("a/b/c", 3);
  store.set("b/c", 3);

  console.log(store.prefix("a"));

  expect(store.prefix("a")).toEqual({ "b": 1, "c": 2 });
});

test("kv to nested json", () => {
  const kv = {
    "a/b": 1,
    "a/c": 2,
    "b/c": 3,
    "a/d/e": 4,
  };
  expect(JsonStore.keyValueToJson(kv)).toEqual({
    "a": {
      "b": {value: 1},
      "c": {value: 2},
      "d": {
        "e": {value: 4}
      },
    },
    "b": {
      "c": {value: 3}
    }
  });
});

test("nested json to kv", () => {
  const json = {
    a: {
      b: {
        c: 1
      },
      d: {
        e: 2
      }
    },
    b: {
      c: {value: 3}
    }
  };

  expect(JsonStore.jsonToKeyValue(json)).toStrictEqual({
    "a/b/c": 1,
    "a/d/e": 2,
    "b/c": 3,
  });
});

test("nested json to kv", () => {
  const json = {
    a: {
      b: {
        c: 1
      },
      d: {
        e: 2
      }
    },
    b: {
      c: 3
    }
  };

  const props = NodeProps.fromKeyValue(JsonStore.jsonToKeyValue(json));
  expect(props.get("a/b/c")).toBe(1);
  expect(props.get("a/d/e")).toBe(2);
  expect(props.get("b/c")).toBe(3);

  const propsJson = props.toJSON();
  expect(propsJson).toStrictEqual({
    a: {
      b: {
        c: {value: 1}
      },
      d: {
        e: {value: 2}
      }
    },
    b: {
      c: {value: 3}
    }
  });

  const props2 = NodeProps.fromJSON(propsJson);

  expect(props2.get("a/b/c")).toBe(1);
  expect(props2.get("a/d/e")).toBe(2);
  expect(props2.get("b/c")).toBe(3);
});
