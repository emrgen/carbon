import { EventHandlerMap } from "../core/types";
import { p14 } from "../core/Logger";
import { AfterPlugin, BeforePlugin, CarbonPlugin } from '../core/CarbonPlugin';
import { EventContext } from "../core/EventContext";
import { SelectionCommands } from "./SelectionCommands";
import { IsolatingPlugin } from "./Isolating";
import { TransformCommands } from "./TransformCommands";
import { skipKeyEvent } from "../utils/key";
import { first, last } from "lodash";
import { Node, Pin, PinnedSelection } from "../core";
import { node } from "@emrgen/carbon-blocks";

// handles general keyboard events
// node specific cases are handles in node specific plugin
export class KeyboardPlugin extends AfterPlugin {

	name = 'keyboard'

	priority = 10001;

	on(): EventHandlerMap {
		return {
			selectstart: (ctx: EventContext<KeyboardEvent>) => {
				// console.log(event)
				// ctx.event.preventDefault();
			},
			beforeInput: (ctx: EventContext<KeyboardEvent>) => {
				const { node, event } = ctx;
				if (node.isAtom) {
					// event.preventDefault()
					return
				}
				// console.log(p14('%c[insert]'), 'color:green', 'text node by keypress');
			}
		}
	}

	plugins(): CarbonPlugin[] {
		return [
			new SelectionCommands(),
			new IsolatingPlugin(),
			new TransformCommands(),
			// new KeyboardPrevent(),
		]
	}

	keydown(): EventHandlerMap {
		return {
			esc: (ctx: EventContext<KeyboardEvent>) => {
				const { app, event, node } = ctx;
				const { selection, nodeSelection } = app
				if (nodeSelection.size) {
					app.tr.selectNodes([]).dispatch();
					app.blur()
					return
				}

				const block = node.chain.find(n => n.isContainerBlock);
				if (!block) return
				app.tr.selectNodes([block.id]).dispatch();
			},
			left: (ctx: EventContext<KeyboardEvent>) => {
				const { app, event, node } = ctx;
				const { selection, cmd, state, nodeSelection } = app;
				const {selectedNodeIds} = state
				event.preventDefault();

				// nodes selection is visible using halo
				if (nodeSelection.size) {
					const { nodes } = nodeSelection;
					const firstNode = first(nodes)!;
					if (firstNode.hasFocusable) {
						const focusNode = firstNode.find(n => n.isFocusable, { direction: 'forward' })
						const pin = Pin.toStartOf(focusNode!)
						app.tr
							.select(PinnedSelection.fromPin(pin!))
							.selectNodes([])
							.dispatch();
						return
					}
					const focusNode = firstNode.prev(n => n.isFocusable);
					const pin = Pin.toEndOf(focusNode!)
					app.tr
						.select(PinnedSelection.fromPin(pin!))
						.selectNodes([])
						.dispatch();
					return
				}

				if (!selection.isCollapsed) {
					cmd.selection.collapseToTail()
					return
				}

				const after = selection.moveBy(-1)
				app.tr.select(after!).dispatch();
			},

			right: (ctx: EventContext<KeyboardEvent>) => {
				const { app, event, node } = ctx;
				event.preventDefault();
				const { selection, cmd, state, nodeSelection } = app;

				// nodes selection is visible using halo
				if (nodeSelection.size) {
					const lastNode = last(nodeSelection.nodes)!;
					if (lastNode.hasFocusable) {
						const focusNode = lastNode.find(n => n.isFocusable, { direction: 'backward' })
						const pin = Pin.toEndOf(focusNode!)
						app.tr
							.select(PinnedSelection.fromPin(pin!))
							.selectNodes([])
							.dispatch();
						return
					}

					const focusNode = lastNode.next(n => n.isFocusable);
					const pin = Pin.toStartOf(focusNode!)
					app.tr
						.select(PinnedSelection.fromPin(pin!))
						.selectNodes([])
						.dispatch();
					return
				}

				if (!selection.isCollapsed) {
					cmd.selection.collapseToHead()
					return
				}

				const after = selection.moveBy(1);
				console.log('#>', after?.toString());
				app.tr.select(after!).dispatch()
			},

			shiftRight: (ctx: EventContext<KeyboardEvent>) => {
				const { app, event, node } = ctx;
				event.preventDefault();
				const { selection, nodeSelection } = app;
				if (!nodeSelection.isEmpty) {
					if (nodeSelection.size > 1) {
						console.log("TODO: select first top level node");
						return
					}

					const block = node.find(n => !n.eq(node) && n.isContainerBlock)
					if (!block) return
					app.tr.selectNodes([block.id]).dispatch();
					return
				}

				const after = selection.moveHead(1);
				app.tr.select(after!).dispatch();
			},

			shiftLeft: (ctx: EventContext<KeyboardEvent>) => {
				const { app, event, node } = ctx;
				event.preventDefault();
				const { selection, nodeSelection } = app;
				if (!nodeSelection.isEmpty) {
					if (nodeSelection.size > 1) {
						console.log("TODO: select first top level node");
						return
					}
					const {parent} = node;
					if (parent?.isRoot) return
					app.tr.selectNodes([parent!.id]).dispatch();
					return
				}

				const after = selection.moveHead(-1);
				app.tr.select(after!).dispatch();
			},

			shiftUp: e => this.shiftUp(e),
			shiftDown: e => this.shiftDown(e),

			delete: (event) => this.delete(event),
			shiftDelete: (event) => this.delete(event),

			backspace: e => this.backspace(e),
			shiftBackspace: e => this.backspace(e),
			ctrlBackspace: skipKeyEvent,
			cmdBackspace: skipKeyEvent,

			shiftEnter: e => this.enter(e),
			enter: e => this.enter(e),
			up: e => this.up(e),
			down : e => this.down(e),

			// 'cmd+a': (event: EditorEvent<KeyboardEvent>) => {
			// 	event.preventDomDefault();
			// 	const { editor } = event;
			// 	const {content: doc, tr} = editor;
			// 	if (!doc) return
			// 	const after = Selection.aroundNode(doc);
			// 	if (!after) return
			// 	tr.select(after).dispatch();
			// }
		}
	}

	shiftUp(ctx: EventContext<KeyboardEvent>) {
		const { app, node } = ctx;
		const { nodeSelection } = app;
		console.log('xxxxx');
		
		if (nodeSelection.isEmpty) return

		const {nodes} = nodeSelection;
		const firstNode = nodes[0] as Node;
		const block = prevContainerBlock(firstNode);
		console.log(block?.id, firstNode.id, nodes.map(n => n.id.toString()));
		if (!block) return

		ctx.event.preventDefault();
		app.tr
			.selectNodes([...nodes.map(n => n.id), block.id])
			.dispatch();
	}

	shiftDown(ctx: EventContext<KeyboardEvent>) {
		const { app, node } = ctx;
		const { nodeSelection } = app;
		if (nodeSelection.isEmpty) return

		const { nodes } = nodeSelection;
		const firstNode = last(nodes) as Node;
		const block = firstNode?.next(n => n.isContainerBlock, { order: 'pre' });
		console.log(block?.id, firstNode.id, nodes.map(n => n.id.toString()));
		if (!block) return

		ctx.event.preventDefault();
		app.tr
			.selectNodes([...nodes.map(n => n.id), block.id])
			.dispatch();
	}

	// handles enter event
	enter(ctx: EventContext<KeyboardEvent>) {
		console.log('Enter event...');

		ctx.event.preventDefault();
		const { app, node } = ctx;
		const { selection, cmd, nodeSelection } = app;
		const {start, end} = selection
		let tr = app.tr;

		if (!nodeSelection.isEmpty) {
			console.log('node selection...');
			const {nodes} = nodeSelection;
			console.log(nodes.map(n => n.id.toString()));
			
			nodes.some(n => {
				const textBlock = n.find(n => n.isTextBlock);

				if (textBlock) {
					const pin = Pin.toEndOf(textBlock)!
					tr
						.selectNodes([])
						.select(PinnedSelection.fromPin(pin))
						.dispatch();
					return true
				}
			})

			return
		}

		// const splitBlock = node.closest(n => n.canSplit);
		node.chain.forEach(n => console.log(n.name, n.groups));
		const splitBlock = node.closest(n => n.groups.includes('nestable'));

		if (!selection.isCollapsed) {
			// cmd.transform.delete()?.dispatch();
		}

		if (!splitBlock) {
			// tr.dispatch();
			console.log('no split block');
			return
		}
		console.log('split section....');

		cmd.transform
			.split(splitBlock, selection, { rootType: app.schema.type('section') })?.dispatch();
		// console.log('###',split);

		// tr.dispatch()
		// split?.dispatch()
		// if (!selection.isCollapsed) {
		// 	console.log('xxx');

		// 	// cmd.transform.delete(selection)?.dispatch();
		// }
		// tr.dispatch()
		// tr.merge(split!).dispatch()
		// split?.dispatch()
	}

	delete(ctx: EventContext<KeyboardEvent>) {
		ctx.preventDefault();
		ctx.event.preventDefault();
		ctx.event.stopPropagation();
console.log('xxxxxxx');

		const { event } = ctx;
		const { app, node } = ctx;
		const { selection } = app;

		const { isCollapsed, head } = selection;
		console.log('xxx');
		if (!isCollapsed) {
			console.log('pppp');
			
			app.cmd.transform.delete()?.dispatch()
			return
		}

		// if (head.isAtEndOfNode(node)) {
		// 	const prevNode = node.next(n => {
		// 		return !n.isSelectable || n.isFocusable
		// 	})
		// 	// console.log(prevNode?.name, prevNode?.isSelectable);
		// 	if (prevNode && !prevNode?.isSelectable) {
		// 		return
		// 	}
		// }


		event.stopPropagation()
		console.log('Keyboard.backspace', selection.moveStart(1)?.toString());
		// editor.cmd.transform.delete(selection.moveStart(1)!)?.dispatch()
	}

	backspace(ctx: EventContext<KeyboardEvent>) {
		ctx.preventDefault();
		ctx.event.preventDefault();
		ctx.event.stopPropagation();

		const { event } = ctx;
		const { app, node } = ctx;
		const { selection, state } = app;
		const {selectedNodeIds} = state;

		const { isCollapsed, head } = selection;
		if (!isCollapsed || selectedNodeIds.size > 0) {
			app.cmd.transform.delete(app.selection)?.dispatch()
			return
		}

		// 	if (head.isAtStartOfNode(node)) {
		// 		const prevNode = node.prev(n => {
		// 			return !n.isSelectable || n.isFocusable
		// 		})
		// 		// console.log(prevNode?.name, prevNode?.isSelectable);
		// 		if (prevNode && !prevNode?.isSelectable) {
		// 			return
		// 		}
		// 	}

		// 	event.stopPropagation()
		// 	if (node.isBlockAtom) {
		// 		const found = node.chain.reverse().find(n => n.isBlockAtom)
		// 		if (!found) return
		// 		// final caret position can be above or below
		// 		const beforeSel = selection.moveStart(-1);
		// 		if (beforeSel) {
		// 			editor.tr
		// 				.add(DeleteCommand.create([node.id]))
		// 				.select(beforeSel.collapseToHead())
		// 				.dispatch()
		// 		}
		// 		return
		// 	}

		const deleteSel = selection.moveStart(-1);
		if (!deleteSel) return

		// find lowest empty that can be deleted without violating the parent schema
		// const list = node.closest(isListNode)

		// const tr = app.cmd.transform.delete(deleteSel);
		// tr?.select(deleteSel.collapseToHead()).dispatch()
		// 	return

		// 	// check if deleteSel head and tail are merge compatible

		// 	console.log('Keyboard.backspace',deleteSel.toString());
		app.cmd.transform.delete(deleteSel)?.dispatch()
	}

	up(ctx: EventContext<KeyboardEvent>) {
		const { app, node } = ctx;
		const { nodeSelection } = app;
		if (nodeSelection.isEmpty) return

		ctx.event.preventDefault();

		if (nodeSelection.size > 1) {
			const { nodes } = nodeSelection
			const lastNode = first(nodes);
			app.tr.selectNodes([lastNode.id]).dispatch()
			return
		}

		const block = prevContainerBlock(node)
		if (!block || block.isRoot) return

		app.tr.selectNodes([block.id]).dispatch()
	}

	down(ctx: EventContext<KeyboardEvent>) {
		const {app, node} = ctx;
		const { nodeSelection } = app;
		if (nodeSelection.isEmpty) return
		ctx.event.preventDefault();

		if (nodeSelection.size > 1) {
			const {nodes} = nodeSelection
			const lastNode = last(nodes);
			app.tr.selectNodes([lastNode.id]).dispatch()
			return
		}

		const block = nextContainerBlock(node)
		if (!block) return
		console.log(block);

		app.tr.selectNodes([block.id]).dispatch()
	}
}

const prevContainerBlock = (node: Node)=> {
	return node?.prev(n => n.isContainerBlock);
}

const nextContainerBlock = node => {
	return node.find(n => !n.eq(node) && n.isContainerBlock, { order: 'pre' }) ?? node?.next(n => n.isContainerBlock, { order: 'pre' });
}


