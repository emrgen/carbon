import { AfterPlugin, EventContext, EventHandlerMap, Pin, PinnedSelection, Point, PointedSelection, nodeLocation } from "@emrgen/carbon-core";
import { isNestableNode } from '../utils';
import { reverse } from 'lodash';

export class ListKeyboardPlugin extends AfterPlugin {

	name = 'listKeyboard'

	priority = 10 ** 4 + 700;

	// keydown(): EventHandlerMap {
	// 	return {
	// 		backspace: (ctx: EventContext<KeyboardEvent>) => {
	// 			const { app, node } = ctx;
	// 			if (node.isIsolating) return;

	// 			const { selection, tr, cmd } = app;
	// 			if (!selection.isCollapsed) {
	// 				return
	// 			}

	// 			const listNode = node.closest(isNestableNode);
	// 			if (!listNode) return
	// 			console.log(listNode?.id.toString(), listNode?.name);
	// 			const atStart = Pin.toStartOf(listNode)?.eq(selection.head);
	// 			console.log(atStart, Pin.toStartOf(listNode), selection.head);

	// 			if (!atStart) return
	// 			const parentList = listNode.parents.find(isNestableNode);

	// 			// change to section
	// 			if (listNode.name !== 'section') {
	// 				ctx.event.preventDefault()
	// 				ctx.event.stopPropagation()
	// 				ctx.stopPropagation();
	// 				const focusNode = listNode.find(n => n.type.isTextBlock)
	// 					?? listNode.find(n => n.isBlock) ?? listNode;
	// 				tr
	// 					.change(listNode.id, listNode.name, 'section')
	// 					.select(PinnedSelection.fromPin(selection.head))
	// 					.dispatch();
	// 				return
	// 			}

	// 			console.log('CCCCCCCCC');

	// 			if (!parentList || parentList.depth > listNode.depth - 1) return

	// 			// pull up
	// 			const nextSibling = listNode.nextSibling;
	// 			if (!nextSibling) {
	// 				console.log('xxxxxxxxx')
	// 				ctx.event.preventDefault()
	// 				ctx.event.stopPropagation();
	// 				ctx.stopPropagation();
	// 				cmd.transform.unwrap(listNode)?.dispatch()
	// 				return
	// 			}

	// 			console.log('should pull the last node');
	// 		},
	// 		shiftBackspace: (ctx: EventContext<KeyboardEvent>) => {
	// 			const { app, node } = ctx;
	// 			const { selection, cmd, tr } = app;
	// 			const listNode = node.closest(isNestableNode);
	// 			// console.log(rootListNode, listNode);
	// 			if (!listNode) return
	// 			const atStart = selection.head.isAtStartOfNode(listNode);
	// 			if (!atStart) return
	// 			const nextSibling = listNode.nextSibling;

	// 			if (listNode.name !== 'section') {
	// 				ctx.event.preventDefault()
	// 				ctx.event.stopPropagation();
	// 				return
	// 			}

	// 			// 	if (!nextSibling) {
	// 			// 		event.preventDomDefault().stopPropagation();
	// 			// 		cmd.transform.unwrap(listNode)?.dispatch()
	// 			// 		return
	// 			// 	}

	// 			// 	// move next sibling inside the pulled node
	// 			// 	if (nextSibling && isListNode(listNode.parent!)) {
	// 			// 		event.preventDomDefault();
	// 			// 		event.stopPropagation();
	// 			// 		const { parent } = listNode;
	// 			// 		if (!parent) return
	// 			// 		const at = Point.toAfter(parent);

	// 			// 		// move next consume nextSiblings
	// 			// 		const to = Point.toAfter(listNode.lastChild!)
	// 			// 		listNode.nextSiblings.forEach(n => {
	// 			// 			tr.add(MoveCommand.create(to, n.id));
	// 			// 		})

	// 			// 		tr.move(at, listNode.id)
	// 			// 			.select(Selection.within(listNode))

	// 			// 		tr.dispatch();
	// 			// 		return
	// 			// 	}
	// 		},
	// 		enter: (ctx: EventContext<KeyboardEvent>) => {
	// 			const { app, node } = ctx;
	// 			const { selection, cmd, schema, tr } = app;
	// 			if (!selection.isCollapsed) {
	// 				return
	// 			}

	// 			const listNode = node.closest(isNestableNode);
	// 			if (!listNode) return
	// 			if (!listNode.isEmpty) return
	// 			const atStart = selection.head.isAtStartOfNode(listNode);


	// 			if (!atStart) return
	// 			const nextSibling = listNode.nextSibling;
	// 			// 	const parentList = listNode.parents.find(isListNode);
	// 			// FIXME: second check is not tested
	// 			// the case might occur when the listNode is within another list but at a distance more than 2
	// 			// if (!parentList || parentList.depth > listNode.depth - 1) {
	// 			// 	console.log('parentList is not found');
	// 			// 	return
	// 			// }
	// 			console.log('XXXXXXX');
	// 			if (listNode.name !== 'section') {
	// 				ctx.event.preventDefault();
	// 				ctx.event.stopPropagation();
	// 				ctx.stopPropagation();
	// 				tr
	// 					.change(listNode.id, listNode.name, 'section')
	// 					.select(PinnedSelection.fromPin(Pin.toStartOf(listNode)!))
	// 					.dispatch();
	// 				return
	// 			}

	// 			console.log('xxx', nextSibling);

	// 			if (!nextSibling) {
	// 				ctx.event.preventDefault();
	// 				ctx.event.stopPropagation();
	// 				ctx.stopPropagation();
	// 				console.log('xxxxxx');

	// 				cmd.transform.unwrap(listNode)?.dispatch();
	// 				return
	// 			}
	// 		},
	// 		// push the
	// 		tab: (ctx: EventContext<KeyboardEvent>) => {
	// 			ctx.event.preventDefault();
	// 			const { app, node } = ctx;
	// 			const { cmd } = app;
	// 			console.log(`tabbed on node: ${node.name} => ${node.id.toString()}`);

	// 			const listNode = node.closest(isNestableNode);
	// 			if (!listNode) return
	// 			const prevNode = listNode.prevSibling;
	// 			if (!prevNode) return

	// 			// move listNode to previous listNode
	// 			console.log(isNestableNode(prevNode));
	// 			if (isNestableNode(prevNode)) {
	// 				const prevSibling = prevNode.lastChild!
	// 				console.log('XXX', listNode, listNode.textContent);
	// 				const to = Point.toAfter(prevSibling.id);
	// 				console.log(to.toString())
	// 				// if (prevNode.isCollapsible) {
	// 				// 	prevNode.updateAttrs({
	// 				// 		collapsed: false
	// 				// 	})
	// 				// }

	// 				const {tr} = app
	// 				reverse(listNode.children.slice(1)).forEach(n => {
	// 					tr.move(nodeLocation(n)!, to, n.id)
	// 				})
	// 				tr.move(nodeLocation(listNode)!, to, listNode.id);
	// 				tr.select(PinnedSelection.fromPin(Pin.toStartOf(listNode)!));
	// 				tr.dispatch();
	// 			}
	// 		},
	// 	}
	// }

	// changeToDefaultList(event: EditorEvent<Event>, listNode: Node) {
	// 	const { editor } = event;
	// 	const { cmd, tr } = editor;
	// 	const { children } = listNode;
	// 	const moveNodes = children.slice(1)
	// 	cmd.transform.change(listNode, 'section')?.dispatch();
	// 	if (moveNodes.length) {
	// 		const at = Point.toAfter(listNode)
	// 		const clonedNodes = moveNodes.map(c => c.clone()) ?? []
	// 		tr
	// 			.insert(at, clonedNodes)
	// 			.delete(moveNodes)
	// 			.dispatch();
	// 	}
	// }
}
