import {EmptyInline} from "@emrgen/carbon-core";
import {CarbonEditor, Node, Pin} from "../core";
import {takeBefore, takeUpto} from "./array";

export function splitTextBlock(
  start: Pin,
  end: Pin,
  app: CarbonEditor,
): [Node[], Node[], Node[]] {
  if (!start.node.eq(end.node)) {
    throw new Error("start and end nodes are not same");
  }

  const startPin = start.down()!.leftAlign;
  const endPin = end.down()!.leftAlign;

  if (EmptyInline.is(startPin.node) && EmptyInline.is(endPin.node)) {
    const startNode = startPin.node!;
    const endNode = endPin.node!;
    if (startPin.eq(endPin)) {
      return [
        [
          ...startNode.prevSiblings.map((n) => n.clone()),
          startNode.type.default()!,
        ],
        [],
        [startNode.clone(), ...startNode.nextSiblings.map((n) => n.clone())],
      ];
    } else {
      return [
        [
          ...startNode.prevSiblings.map((n) => n.clone()),
          startNode.type.default()!,
        ],
        [
          startNode.type.default()!,
          ...takeUpto(startNode.nextSiblings, (n) => n.eq(endNode)),
        ],
        [endNode.clone(), ...endNode.nextSiblings.map((n) => n.clone())],
      ];
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
