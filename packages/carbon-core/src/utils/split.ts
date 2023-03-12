// import { Editor } from '../core/Editor';
// import { p14 } from '../core/Logger';
// import { Pin } from '../core/Pin'
// import { Fragment } from '../core/Fragment';
// import { Node } from '../core/Node';

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
