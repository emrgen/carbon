import { assert, expect, test } from "vitest";
import { NodeTopicEmitter } from "../src/core/NodeEmitter";
import { Node } from "../src/core/Node";

test("node-topic-emitter", () => {
  const bus = new NodeTopicEmitter();
  let v1,v2;

  const cb = (n, v) => {
    v1 = v;
  }

  const node = Node.IDENTITY;
  bus.on( node.id, "test", cb);

  assert((() => {
    bus.emit(node, "test", 1);
    return v1 === 1;
  })());

  const wcb = (n, v) => {
    v1 = v + 1;
  }
  bus.on(node.id, "*", wcb);

  assert((() => {
    bus.emit(node, "*",2);
    return v1 === 3;
  })());

  assert((() => {
    bus.emit(node, "x",3);
    return v1 === 4;
  })());

  bus.off(node.id, "*", wcb);

  assert((() => {
    bus.emit(node, "*",10);
    return v1 === 4;
  })());

});