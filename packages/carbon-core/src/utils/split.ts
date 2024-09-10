import { Carbon, Node, Pin } from "../core";
import { takeBefore } from "./array";
import { EmptyInline } from "@emrgen/carbon-core";

export function splitTextBlock(
  start: Pin,
  end: Pin,
  app: Carbon,
): [Node[], Node[], Node[]] {
  const startPin = start.down()!;
  const endPin = end.down()!;

  if (EmptyInline.is(startPin.node) && EmptyInline.is(endPin.node)) {
    if (startPin.eq(endPin)) {
      console.log("xxxxxxxxxxx");
      const node = startPin.node.parent!;
      if (EmptyInline.isPrefix(startPin.node)) {
        console.log("prefix", node.name);
        return [
          node.prevSiblings.map((n) => n.clone()),
          [],
          [node.clone(), ...node.nextSiblings.map((n) => n.clone())],
        ];
      }
      if (EmptyInline.isSuffix(startPin.node)) {
        console.log("suffix");
        return [
          [...node.prevSiblings.map((n) => n.clone()), node.clone()],
          [],
          node.nextSiblings.map((n) => n.clone()),
        ];
      }
    }
  }

  if (EmptyInline.is(startPin.node)) {
  }
  if (EmptyInline.is(endPin.node)) {
  }

  // both startPin and endPin are associated with the simple inline node

  const beforeNodes: Node[] = startPin.node.prevSiblings.map((n) => n.clone());
  const middleNodes: Node[] = takeBefore(
    startPin.node.prevSiblings.map((n) => n.clone()),
    (n) => n.eq(endPin.node),
  );
  const afterNodes: Node[] = endPin.node.nextSiblings.map((n) => n.clone());

  if (startPin.eq(endPin)) {
    if (startPin.isWithin) {
      const { node, offset } = startPin;
      const { textContent } = node;

      console.log("split text....", textContent);
      const leftTextNode = app.schema.text(textContent.slice(0, offset));
      const rightTextNode = app.schema.text(textContent.slice(offset));
      beforeNodes.push(leftTextNode!);
      afterNodes.unshift(rightTextNode!);
    }

    if (startPin.isAfter) {
      const { node } = startPin;
      beforeNodes.push(node.clone());
    }

    if (startPin.isBefore) {
      const { node } = startPin;
      afterNodes.unshift(node.clone());
    }
  } else {
    // console.log(beforeNodes, middleNodes, afterNodes);
    if (startPin.isWithin) {
      const { node, offset } = startPin;
      const { textContent } = node;

      console.log("split text....", textContent);
      const leftTextNode = app.schema.text(textContent.slice(0, offset));
      const rightTextNode = app.schema.text(textContent.slice(offset));
      beforeNodes.push(leftTextNode!);
      middleNodes.unshift(rightTextNode!);
    }

    if (startPin.isAfter) {
      const { node } = startPin;
      beforeNodes.push(node.clone());
    }

    if (startPin.isBefore) {
      const { node } = startPin;
      middleNodes.unshift(node.clone());
    }

    if (endPin.isWithin) {
      const { node, offset } = endPin;
      const { textContent } = node;

      console.log("split text....", textContent);
      const leftTextNode = app.schema.text(textContent.slice(0, offset));
      const rightTextNode = app.schema.text(textContent.slice(offset));
      middleNodes.push(leftTextNode!);
      afterNodes.unshift(rightTextNode!);
    }

    if (endPin.isAfter) {
      const { node } = endPin;
      middleNodes.push(node.clone());
    }

    if (endPin.isBefore) {
      const { node } = endPin;
      afterNodes.unshift(node.clone());
    }
  }

  return [beforeNodes, middleNodes, afterNodes];
}
