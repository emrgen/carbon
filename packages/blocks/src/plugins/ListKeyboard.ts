import { AfterPlugin, EventContext, EventHandlerMap, Pin, PointedSelection } from "@emrgen/carbon-core";
import { isNestableNode } from '../utils';

export class ListKeyboardPlugin extends AfterPlugin {

	name = 'listKeyboard'

	priority = 10 ** 4 + 700;

	keydown(): EventHandlerMap {
		return {
			backspace: (ctx: EventContext<KeyboardEvent>) => {
				const { app, node } = ctx;
				const { selection, tr, cmd } = app;
				if (!selection.isCollapsed) {
					return
				}

				const listNode = node.closest(isNestableNode);
				if (!listNode) return
				console.log(listNode?.id.toString(), listNode?.name);
				const atStart = Pin.toStartOf(listNode)?.eq(selection.head);
				console.log(atStart, Pin.toStartOf(listNode), selection.head);
				
				if (!atStart) return
				const parentList = listNode.parents.find(isNestableNode);

				// change to section
				if (listNode.name !== 'section') {
					ctx.event.preventDefault()
					ctx.event.stopPropagation()
					const focusNode = listNode.find(n => n.type.isTextBlock)
						?? listNode.find(n => n.isBlock) ?? listNode;
					tr
						.change(listNode.id, listNode.name, 'section')
						// .select(PointedSelection.within(focusNode))
						.dispatch();
					return
				}

				if (!parentList || parentList.depth > listNode.depth - 1) return

				// pull up
				const nextSibling = listNode.nextSibling;
				if (!nextSibling) {
					ctx.event.preventDefault()
					ctx.event.stopPropagation();
					cmd.transform.unwrap(listNode)?.dispatch()
					return
				}

				console.log('should pull the last node');

			},
			// 'shift+backspace': (event: EditorEvent<KeyboardEvent>) => {
			// 	const { editor, node } = event;
			// 	const { selection, cmd, tr } = editor;
			// 	const listNode = node.closest(isListNode);
			// 	// console.log(rootListNode, listNode);
			// 	if (!listNode) return
			// 	const atStart = selection.head.isAtStartOfNode(listNode);
			// 	if (!atStart) return
			// 	const nextSibling = listNode.nextSibling;

			// 	if (listNode.name !== 'section') {
			// 		event.preventDomDefault().stopPropagation();
			// 		this.changeToDefaultList(event, listNode)
			// 		return
			// 	}

			// 	if (!nextSibling) {
			// 		event.preventDomDefault().stopPropagation();
			// 		cmd.transform.unwrap(listNode)?.dispatch()
			// 		return
			// 	}

			// 	// move next sibling inside the pulled node
			// 	if (nextSibling && isListNode(listNode.parent!)) {
			// 		event.preventDomDefault();
			// 		event.stopPropagation();
			// 		const { parent } = listNode;
			// 		if (!parent) return
			// 		const at = Point.toAfter(parent);

			// 		// move next consume nextSiblings
			// 		const to = Point.toAfter(listNode.lastChild!)
			// 		listNode.nextSiblings.forEach(n => {
			// 			tr.add(MoveCommand.create(to, n.id));
			// 		})

			// 		tr.move(at, listNode.id)
			// 			.select(Selection.within(listNode))

			// 		tr.dispatch();
			// 		return
			// 	}
			// },
			// enter: (event: EditorEvent<KeyboardEvent>) => {
			// 	const { editor, node } = event;
			// 	const { selection, cmd, schema, tr } = editor;
			// 	const { start } = selection
			// 	if (!selection.isCollapsed) {
			// 		return
			// 	}

			// 	const listNode = node.closest(isListNode);
			// 	if (!listNode) return
			// 	if (!listNode.isEmpty) return
			// 	const atStart = selection.head.isAtStartOfNode(listNode);
			// 	if (!atStart) return
			// 	const nextSibling = listNode.nextSibling;
			// 	const parentList = listNode.parents.find(isListNode);
			// 	// FIXME: second check is not tested
			// 	// the case might occur when the listNode is within another list but at a distance more than 2
			// 	if (!parentList || parentList.depth > listNode.depth - 1) {
			// 		console.log('parentList is not found');
			// 		return
			// 	}

			// 	if (listNode.name !== 'section') {
			// 		console.log('change to section')
			// 		event.preventDomDefault().stopPropagation();
			// 		this.changeToDefaultList(event, listNode)
			// 		return
			// 	}

			// 	if (!nextSibling) {
			// 		event.preventDomDefault().stopPropagation();
			// 		cmd.transform.unwrap(listNode)?.dispatch()
			// 		return
			// 	}
			// },
			// // push the
			// tab: (event: EditorEvent<KeyboardEvent>) => {
			// 	const { editor, node } = event;
			// 	const { cmd } = editor;
			// 	console.log(`tabbed on node: ${node.name} => ${node.id.toString()}`);

			// 	const listNode = node.closest(isListNode);
			// 	if (!listNode) return
			// 	const prevNode = listNode.prevSibling;
			// 	if (!prevNode) return

			// 	// move listNode to previous listNode
			// 	// console.log(isListNode(prevNode));
			// 	if (isListNode(prevNode)) {
			// 		const prevSibling = prevNode.lastChild!
			// 		console.log('XXX', listNode, listNode.textContent);
			// 		const to = Point.toAfter(prevSibling);

			// 		if (prevNode.isCollapsible) {
			// 			prevNode.updateAttrs({
			// 				collapsed: false
			// 			})
			// 		}

			// 		cmd.transform.move(listNode, to)?.dispatch();
			// 	}
			// },
		}
	}

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
