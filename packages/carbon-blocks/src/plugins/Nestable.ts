import { AfterPlugin, Carbon, EventContext, EventHandlerMap, Node, Pin, PinnedSelection, Point, PointedSelection, Transaction, nodeLocation, preventAndStop, preventAndStopCtx } from "@emrgen/carbon-core";
import { isNestableNode } from '../utils';
import { reverse } from 'lodash';
import { Optional } from '@emrgen/types';

declare module '@emrgen/carbon-core' {
	interface CarbonCommands {
		nestable: {
			wrap(node: Node, parent: Node): Optional<Transaction>;
			unwrap(node: Node): Optional<Transaction>;
		}
	}
}


export class NestablePlugin extends AfterPlugin {

	name = 'nestable'

	priority = 10 ** 4 + 700;

	commands(): Record<string, Function> {
		return {
			wrap: this.wrap,
			unwrap: this.unwrap,
		}
	}

	// wrap node within a parent node
	wrap(app: Carbon, node: Node, parent: Node): Optional<Transaction> {
		const prevSibling = parent.lastChild!
		const to = Point.toAfter(prevSibling.id);
		// if (prevNode.isCollapsible) {
		// 	prevNode.updateAttrs({
		// 		collapsed: false
		// 	})
		// }

		// const tr = app.cmd.transform.move([...node.children.slice(1), ], to)
		const { tr } = app;
		tr?.move(nodeLocation(node)!, to, node.id);
		if (parent.isCollapsed) {
			tr?.updateData(parent.id, { node: { collapsed: false } })
		}
		tr?.select(app.selection.clone());

		return tr
	}

	unwrap(app: Carbon, node: Node): Transaction {
		const { tr } = app;
		return tr
	}

	keydown(): EventHandlerMap {
		return {
			backspace: (ctx: EventContext<KeyboardEvent>) => {
				const { app, node } = ctx;
				if (node.isIsolating) return;

				const { selection, tr, cmd } = app;
				if (!selection.isCollapsed) {
					return
				}

				const listNode = node.closest(isNestableNode);
				if (!listNode) return
				// console.log(listNode?.id.toString(), listNode?.name);
				const atStart = Pin.toStartOf(listNode)?.eq(selection.head);
				// console.log(atStart, Pin.toStartOf(listNode), selection.head);

				if (!atStart) return
				const parentList = listNode.parents.find(isNestableNode);

				if (listNode.attrs.html['data-as']) {
					preventAndStopCtx(ctx);
					tr
						.updateAttrs(listNode.id, {
							html: {
								'data-as': '',
							},
						}).select(selection)
						.dispatch();
					return
				}

				// change to section
				if (listNode.name !== 'section') {
					preventAndStopCtx(ctx);
					tr
						.change(listNode.id, listNode.name, 'section')
						.select(PinnedSelection.fromPin(selection.head))
						.dispatch();
					return
				}

				if (!parentList || parentList.depth > listNode.depth - 1) return

				// pull up
				const nextSibling = listNode.nextSibling;
				if (!nextSibling) {
					preventAndStopCtx(ctx);
					cmd.transform.unwrap(listNode)?.dispatch()
					return
				}

				console.log('should pull the last node');
			},
			shiftBackspace: (ctx: EventContext<KeyboardEvent>) => {
				const { app, node } = ctx;
				const { selection, cmd, tr } = app;
				const listNode = node.closest(isNestableNode);
				// console.log(rootListNode, listNode);
				if (!listNode) return
				const atStart = selection.head.isAtStartOfNode(listNode);
				if (!atStart) return
				const nextSibling = listNode.nextSibling;

				if (listNode.name !== 'section') {
					ctx.event.preventDefault()
					ctx.event.stopPropagation();
					return
				}

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
			},
			enter: (ctx: EventContext<KeyboardEvent>) => {
				const { app, node } = ctx;
				const { selection, cmd,  tr } = app;
				if (!selection.isCollapsed) {
					return
				}

				// when the cursor is at start of the empty node
				const listNode = node.closest(isNestableNode);
				if (!listNode) return
				if (!listNode.isEmpty) return
				const atStart = selection.head.isAtStartOfNode(listNode);
				if (!atStart) return

				if (listNode.attrs.html['data-as']) {
					preventAndStopCtx(ctx);
					tr
						.updateAttrs(listNode.id, {
							html: {
								'data-as': ''
							}
						}).select(selection)
						.dispatch();
					return
				}

				if (listNode.name !== 'section') {
					preventAndStopCtx(ctx);
					tr
						.change(listNode.id, listNode.name, 'section')
						.select(PinnedSelection.fromPin(Pin.toStartOf(listNode)!))
						.dispatch();
					return
				}

				const nextSibling = listNode.nextSibling;
				// if parent is collapsible the listNode should be not unwrapped
				if (!nextSibling && !listNode.parent?.isCollapsible) {
					preventAndStopCtx(ctx);
					cmd.transform.unwrap(listNode)?.dispatch();
					return
				}
			},
			// push the
			tab: (ctx: EventContext<KeyboardEvent>) => {
				preventAndStopCtx(ctx);
				const { app, node } = ctx;
				console.log(`tabbed on node: ${node.name} => ${node.id.toString()}`);

				const { selection, tr } = app;
				const container = selection.start.node.closest(n => n.isContainerBlock);
				const listNode = isNestableNode(container!) ? container : undefined;
				if (!listNode) return
				const prevNode = listNode.prevSibling;
				if (!prevNode || !isNestableNode(prevNode)) return

				// move listNode to previous listNode
				if (selection.isCollapsed) {
					// if (listNode.size > 1) {
					// 	const at = Point.toAfter(prevNode.id);
					// 	app.chain.cmd
					// 		.transform.move(listNode.children.slice(1), at)
					// 		?.cmd.nestable.wrap(listNode, prevNode)
					// 		?.dispatch();
					// } else {
					// }
					app.cmd.nestable.wrap(listNode, prevNode)?.dispatch();
				} else {
				}
			},
		}
	}
}
