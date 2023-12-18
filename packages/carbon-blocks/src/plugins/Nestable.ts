import {
	AfterPlugin,
	Carbon,
	EventContext,
	EventHandlerMap,
	Node,
	Pin,
	PinnedSelection,
	Point,
	Transaction,
	nodeLocation,
	preventAndStopCtx, moveNodesActions, PlaceholderPath, EmptyPlaceholderPath
} from "@emrgen/carbon-core";
import { isNestableNode } from '../utils';
import { Optional } from '@emrgen/types';
import { takeBefore } from "@emrgen/carbon-core/src/utils/array";

declare module '@emrgen/carbon-core' {
	interface CarbonCommands {
		nestable: {
			wrap(node: Node): Optional<Transaction>;
			unwrap(node: Node): Optional<Transaction>;
			serializeChildren(node: Node): string;
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
			serializeChildren: this.serializeChildren,
		}
	}

	// wrap node within a parent node
	// TODO: add support for wrapping multiple nodes
	wrap(app: Carbon, node: Node): Optional<Transaction> {
		const prevNode = node.prevSibling;
		if (!prevNode || !isNestableNode(prevNode)) return

		const prevSibling = prevNode.lastChild!
		const to = Point.toAfter(prevSibling.id);

		const { tr } = app;
		tr?.move(nodeLocation(node)!, to, node.id);
		if (prevNode.isCollapsed) {
			tr?.updateProps(prevNode.id, { node: { collapsed: false } })
		}
		tr?.select(app.selection.clone());

		return tr
	}

	// TODO: add support for unwrapping multiple nodes
	unwrap(app: Carbon, node: Node): Optional<Transaction> {
		const {parent} = node;
		if (!isNestableNode(parent!)) return

		// move node after the parent
		const to = Point.toAfter(parent!.id)
		// consume the next siblings
		const {nextSiblings} = node;
		const lastChild = node.lastChild;
		const moveAt = Point.toAfter(lastChild?.id ?? node.id);

		const { tr } = app;

		tr
			.move(nodeLocation(node)!, to, node.id)
			.add(moveNodesActions(moveAt, nextSiblings))
			.select(app.selection.clone());

		return tr
	}

	keydown(): EventHandlerMap {
		return {
			backspace: (ctx: EventContext<KeyboardEvent>) => {

				const { app, node } = ctx;
				if (node.isIsolating) return;

				const { selection, tr, cmd, state } = app;
				if (!selection.isCollapsed || selection.isBlock) {
					return
				}

				const listNode = node.closest(isNestableNode);
				console.log(listNode);
				if (!listNode) return
				const head = selection.head.node.isEmpty ? selection.head.down() : selection.head;
				if (!head) return

				// console.log(listNode?.id.toString(), listNode?.name, head.toString(), Pin.toStartOf(listNode)?.toJSON());
				const atStart = Pin.toStartOf(listNode)?.eq(head);
				// console.log(atStart, Pin.toStartOf(listNode)?.node.name, head.node.name);

				if (!atStart) return
				const parentList = listNode.parents.find(isNestableNode);
				// change to section
				if (listNode.name !== 'section') {
					preventAndStopCtx(ctx);
					if (listNode.isCollapsed) {
						tr.updateProps(listNode.id, { node: { collapsed: false } })
					}

					// if (listNode.firstChild?.isEmpty) {
					// 	tr.updateProps(listNode.firstChild?.id!, {
					// 		[PlaceholderPath]: app.schema.type('section').props.get(EmptyPlaceholderPath)
					// 	})
					// }

					tr
						.change(listNode.id, listNode.name, 'section')
						.select(PinnedSelection.fromPin(selection.head))
					tr.dispatch();
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
				const { selection} = app;
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

				const as = listNode.properties.get('html.data-as')
				if (as && as !== listNode.name) {
					preventAndStopCtx(ctx);
					tr
						.updateProps(listNode.id, {
							html: {
								'data-as': ''
							}
						}).select(selection)
						.dispatch();
					return
				}

				if (listNode.name !== 'section') {
					console.log(`enter on node: ${listNode.name} => ${listNode.id.toString()}`, isNestableNode(listNode));

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
				const { selection } = app;
				console.log(`tabbed on node: ${node.name} => ${node.id.toString()}`);

				const container = node.closest(n => n.isContainerBlock);
				console.log(container?.name, node.name, node.type.isBlock && !node.type.isTextBlock);
				console.log(node.chain.map(n => n.name).join(' > '));

				const listNode = isNestableNode(container!) ? container : undefined;
				if (!listNode) return
				const prevNode = listNode.prevSibling;
				if (!prevNode || !isNestableNode(prevNode)) return

				if (selection.nodes.length > 1) {
					return
				}
				app.cmd.nestable.wrap(listNode)?.dispatch();
			},
			shiftTab: (ctx: EventContext<KeyboardEvent>) => {
				preventAndStopCtx(ctx);
				const { app, node } = ctx;
				const { selection } = app;
				const listNode = node.closest(isNestableNode);
				if (!listNode) return
				const {parent} = listNode;
				if (!parent || !isNestableNode(parent)) return

				if (selection.nodes.length > 1) {
					return
				}

				app.cmd.nestable.unwrap(listNode)?.dispatch();
			}
		}
	}

	serializeChildren(app: Carbon, node: Node): string {
		const children = node.children.slice(1);
		const depth = takeBefore(node.parents, (n: Node) => !isNestableNode(n)).length + 1;
		if (!children.length) return ''
		return '\n' + children.map(n => app.serialize(n)).map(a => ` `.repeat(depth) + a).join('\n')
	}
}
