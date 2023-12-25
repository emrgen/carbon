import {expect, test} from 'vitest'
import {IndexMap, IndexMapper} from "../src/core/IndexMap";

test('index-map', t => {
  const mapper = new IndexMapper();

  const identity = IndexMap.DEFAULT;
  mapper.add(identity);
  expect(mapper.map(identity, 0)).toBe(0);
  expect(mapper.map(identity, 10)).toBe(10);

  // 10 nodes inserted at index 10
  const m1 = new IndexMap(10, 19, 1);
  mapper.add(m1);

  expect(mapper.map(m1, 0)).toBe(0);
  expect(mapper.map(m1, 10)).toBe(10);
  expect(mapper.map(m1, 20)).toBe(20);
  expect(mapper.map(m1, 21)).toBe(21);

  expect(mapper.map(identity, 0)).toBe(0);

  console.log(identity.position)
  expect(mapper.map(identity, 10)).toBe(20);
  expect(mapper.map(identity, 20)).toBe(30);

  // node inserted at index 3
  const m2 = new IndexMap(3, 3, 1);
  mapper.add(m2);

  // all indexes before 3 are unchanged
  expect(mapper.map(identity, 0)).toBe(0);
  expect(mapper.map(identity, 2)).toBe(2);

  // index 3 is now 4
  expect(mapper.map(identity, 3)).toBe(4);

  // index 4 is now 5
  expect(mapper.map(identity, 4)).toBe(5);

  // index 10 is now 21
  expect(mapper.map(identity, 10)).toBe(21);

  expect(mapper.map(identity, 15)).toBe(26);

  // 2 nodes removed at index 15
  const m3 = new IndexMap(15, 16, -1);
  mapper.add(m3);

  // all indexes before 15 are unchanged
  expect(mapper.map(identity, 0)).toBe(0);
  expect(mapper.map(identity, 14)).toBe(23);

  // index 15 is now 24
  expect(mapper.map(identity, 15)).toBe(24);

  // index 16 is now 25
  expect(mapper.map(identity, 16)).toBe(25);
});

test('find previous index map', () => {
  const mapper = new IndexMapper();
  const m1 = IndexMap.DEFAULT;
  mapper.add(m1);

  // insert 3 nodes at 10
  const m2 = new IndexMap(10, 12, 1);
  mapper.add(m2);

  // find current index of a node (index 11) with current mapper identity
  expect(mapper.map(m1, 11)).toBe(14);
});
