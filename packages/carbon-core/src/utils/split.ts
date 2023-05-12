// import { Editor } from '../core/Editor';
// import { p14 } from '../core/Logger';
// import { Pin } from '../core/Pin'
// import { Fragment } from '../core/Fragment';
// import { Node } from '../core/Node';

import { Carbon, Node, Pin, PinnedSelection } from "../core";
import { BlockContent, NodeContent } from "../core/NodeContent";
import { takeAfter, takeBefore, takeUntil } from "./array";

// export function splitNodeAtPin(focus: Pin, editor: Editor): Node[] {
// 	const {node, offset} = focus
// 	return splitNodeAtOffset(node, offset, editor)
// }

// export function splitNodeAtOffset(node: Node, offset: number, editor: Editor): Node[] {
// 	if (0 >= offset || offset >= node.focusSize) {
// 		console.log('not splitted')
// 		return [node];
// 	}

// 	const { parent } = node;
// 	const insertNodes = node.split(offset);

// 	parent?.insertAfter(Fragment.from(insertNodes), node);
// 	// console.log('after split insert', parent?.textContent);

// 	parent?.remove(node);
// 	editor.store.delete(node);
// 	// console.log(p14('%c[split]'), 'color:pink', insertNodes, insertNodes.map(n => n.id.key));
// 	insertNodes.forEach(n => editor.store.put(n));

// 	return insertNodes
// }

export function splitTextBlock(start: Pin, end: Pin, app: Carbon): NodeContent[] {
  const startPin = start.down()!;
  const endPin = end.down()!;
  const beforeNodes: Node[] = startPin.node.prevSiblings.map(n => n.clone());
  const middleNodes: Node[] = takeBefore(startPin.node.prevSiblings.map(n => n.clone()), n => n.eq(endPin.node))
  const afterNodes: Node[] = endPin.node.nextSiblings.map(n => n.clone());

  const ret = () => [beforeNodes, middleNodes, afterNodes].map(nodes => BlockContent.create(nodes));

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

    return ret();
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

    return ret();
  }
}
