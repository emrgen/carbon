import {expect, test} from "vitest";
import {NodeIdTree} from "../src/core/NodeIdTree";
import {NodeId, Point} from "@emrgen/carbon-core";

test('insert node id at index', () => {
  const tree = new NodeIdTree();

  // 1
  const n1 = NodeId.create('1')
  tree.insert(Point.toStart(NodeId.ROOT), n1);
  // expect(tree.indexOf(n1)).toBe(0);

  // 1, 2
  const n2 = NodeId.create('2')
  tree.insert(Point.toAfter(n1), n2)
  // expect(tree.indexOf(n2)).toBe(1);

  // 1, 3, 2
  const n3 = NodeId.create('3')
  tree.insert(Point.toAfter(n1), n3)
  // expect(tree.indexOf(n3)).toBe(1);
  expect(tree.indexOf(n2)).toBe(2);

  // 4, 1, 3, 2
  const n4 = NodeId.create('4')
  tree.insert(Point.toStart(NodeId.ROOT), n4)
  expect(tree.indexOf(n4)).toBe(0);
  expect(tree.indexOf(n1)).toBe(1);
  expect(tree.indexOf(n2)).toBe(3);
  expect(tree.indexOf(n3)).toBe(2);

  // 4, 3, 2
  tree.remove(n1);
  expect(tree.indexOf(n4)).toBe(0);
  expect(tree.indexOf(n3)).toBe(1);
  expect(tree.indexOf(n2)).toBe(2);

  // 4(1), 3, 2
  tree.insert(Point.toStart(n4), n1);
  expect(tree.indexOf(n1)).toBe(0);
  expect(tree.indexOf(n4)).toBe(0);
})
