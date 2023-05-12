// import { Editor } from '../core/Editor';
// import { p14 } from '../core/Logger';
// import { Pin } from '../core/Pin'
// import { Fragment } from '../core/Fragment';
// import { Node } from '../core/Node';

import { Carbon, Node, Pin } from "../core";
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

export function splitTextBlockAtPin(pin: Pin, app: Carbon): [NodeContent, NodeContent] {
  const downPin = pin.down()!;
  const beforeNodes: Node[] = downPin.node.prevSiblings.map(n => n.clone());
  const afterNodes: Node[] = downPin.node.nextSiblings.map(n => n.clone());

  if (downPin.isWithin) {
    const { node, offset } = downPin;
    const { textContent } = node;

    console.log("split text....", textContent);
    const leftTextNode = app.schema.text(textContent.slice(0, offset));
    const rightTextNode = app.schema.text(textContent.slice(offset));
    beforeNodes.push(leftTextNode!);
    afterNodes.unshift(rightTextNode!);
  }

  if (downPin.isAfter) {
    const { node } = downPin;
    beforeNodes.push(node.clone());
  }

  if (downPin.isBefore) {
    const { node } = downPin;
    afterNodes.unshift(node.clone());
  }

  return [BlockContent.create(beforeNodes), BlockContent.create(afterNodes)];
}
