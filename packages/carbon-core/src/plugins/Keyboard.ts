import { EventHandler, EventHandlerMap } from "../core/types";
import { p14 } from "../core/Logger";
import { AfterPlugin, BeforePlugin, CarbonPlugin } from '../core/CarbonPlugin';
import { EventContext } from "../core/EventContext";
import { SelectionCommands } from "./SelectionCommands";
import { IsolatingPlugin } from "./Isolating";
import { TransformCommands } from "./TransformCommands";
import { skipKeyEvent } from "../utils/key";
import { first, last, reverse } from "lodash";
import { BlockContent, Carbon, InlineContent, MoveAction, Node, Pin, PinnedSelection, Point, Transaction } from "../core";
import { hasParent, nodePath } from "../utils/node";
import { CommandPlugin } from '@emrgen/carbon-core';
import { Optional } from '@emrgen/types';
import { nodeLocation } from '../utils/location';


declare module '@emrgen/carbon-core' {
	export interface CarbonCommands {
		keyboard: {
			backspace(ctx: EventContext<KeyboardEvent>): Optional<Transaction>;
		};
	}
}

export class KeyboardPlugin extends BeforePlugin {
	name = 'keyboard';

	commands(): Record<string, Function> {
		return {
			backspace: this.backspace,
		}
	}

	backspace(app: Carbon, ctx: EventContext<KeyboardEvent>) {
		ctx.preventDefault();
		ctx.event.preventDefault();
		ctx.event.stopPropagation();

		const { node } = ctx;
		const { selection, state, cmd, blockSelection: nodeSelection } = app;

		const { isCollapsed, head } = selection;
		// delete node selection if any
		if (!nodeSelection.isEmpty) {
			cmd.transform.deleteNodes(nodeSelection, { fall: 'before' })?.dispatch();
			return
		}

		if (!isCollapsed) {
			cmd.transform.delete(app.selection)?.dispatch();
			return
		}

		console.log('xxxxxxxxxxxx');
		if (head.isAtStartOfNode(node)) {
			const { start } = selection;
			const textBlock = start.node.chain.find(n => n.isTextBlock)
			const prevTextBlock = textBlock?.prev(n => !n.isIsolating && n.isTextBlock, { skip: n => n.isIsolating });
			if (!prevTextBlock || !textBlock) return
			console.log(prevTextBlock.parent);

			if (prevTextBlock.isCollapseHidden) {
				const prevVisibleBlock = prevTextBlock.closest(n => !n.isCollapseHidden)!;
				const prevVisibleTextBlock = prevVisibleBlock?.child(0)!
				console.log(prevTextBlock, prevVisibleTextBlock);

				if (!prevVisibleTextBlock) return
				const after = PinnedSelection.fromPin(Pin.create(prevVisibleTextBlock, prevVisibleTextBlock.textContent.length));
				const textContent = prevVisibleTextBlock.textContent + textBlock.textContent;
				const textNode = app.schema.text(textContent)!;
				const content = BlockContent.create([textNode]);

				const at = Point.toAfter(prevVisibleBlock.id);
				const moveActions = textBlock?.nextSiblings.slice().reverse().map(n => {
					return MoveAction.create(nodeLocation(n)!, at, n.id);
				});

				app.tr
					.setContent(prevVisibleTextBlock.id, content)
					.add(moveActions)
					.remove(nodeLocation(textBlock.parent!)!, textBlock.parent!.id)
					.select(after)
					.dispatch();

				return
			}

			console.log('merge text block', prevTextBlock.name, textBlock.name);
			cmd.transform.merge(prevTextBlock, textBlock)?.dispatch();
			return
		}

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

		// 	console.log('Keyboard.backspace',deleteSel.toString());
		const deleteSel = selection.moveStart(-1)
		if (!deleteSel) return
		cmd.transform.delete(deleteSel)?.dispatch()
	}
}

export class KeyboardBeforePlugin extends BeforePlugin {

	name = 'keyboardBefore'

	on(): Partial<EventHandler> {
		return {
			$mouseDown: (ctx: EventContext<MouseEvent>) => {
				const {app, node} = ctx;
				const {selection} = app;
				const {start, end} = selection;
				const isolating = start.node.find(n => n.isIsolating);
				if (!isolating) {
					return
				}

				if (hasParent(node, isolating)) {
					return
				}

			}
		}
	}
}

// handles general keyboard events
// node specific cases are handles in node specific plugin
export class KeyboardAfterPlugin extends AfterPlugin {

	name = 'keyboardAfter'

	priority = 10001;

	on(): EventHandlerMap {
		return {
			selectstart: (ctx: EventContext<KeyboardEvent>) => {
				// console.log('xxxxxxxxxxxxxxxxxxxxxx', ctx.event)
				// ctx.event.preventDefault();
				// ctx.event.stopPropagation();
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
			new KeyboardPlugin(),
		]
	}

	keydown(): EventHandlerMap {
		return {
			esc: (ctx: EventContext<KeyboardEvent>) => {
				const { app, event, node } = ctx;
				const { selection, blockSelection: nodeSelection } = app
				if (nodeSelection.size) {
					// app.tr.selectNodes([]).dispatch();
					// app.blur()
					return
				}

				const block = node.chain.find(n => n.isContainerBlock);
				if (!block || !block.type.spec.rectSelectable) return
				app.tr.selectNodes([block.id]).dispatch();
			},
			left: (ctx: EventContext<KeyboardEvent>) => {
				const { app, event, node } = ctx;
				const { selection, cmd, state, blockSelection: nodeSelection } = app;
				const {selectedNodeIds} = state
				event.preventDefault();

				// nodes selection is visible using halo
				if (nodeSelection.size) {
					const { blocks: nodes } = nodeSelection;
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
				const { selection, cmd, state, blockSelection: nodeSelection } = app;

				// nodes selection is visible using halo
				if (nodeSelection.size) {
					const lastNode = last(nodeSelection.blocks)!;
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
				const { selection, blockSelection: nodeSelection } = app;
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
				const { selection, blockSelection: nodeSelection } = app;
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

			backspace: e => {
				console.log(e.app);
				e.app.cmd.keyboard.backspace(e)?.dispatch()
			},
			shiftBackspace: e => e.app.cmd.keyboard.backspace(e)?.dispatch(),
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
		const { blockSelection: nodeSelection } = app;
		console.log('xxxxx');
		
		if (nodeSelection.isEmpty) return

		const {blocks: nodes} = nodeSelection;
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
		const { blockSelection: nodeSelection } = app;
		if (nodeSelection.isEmpty) return

		const { blocks: nodes } = nodeSelection;
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
		const { app } = ctx;
		const { selection, cmd, blockSelection } = app;
		const {start, end} = selection
		const {node} = start;
		let tr = app.tr;

		// put the cursor at the end of the first text block
		if (!blockSelection.isEmpty) {
			console.log('node selection...');
			const {blocks: nodes} = blockSelection;
			console.log(nodes.map(n => n.id.toString()));

			const done = nodes.some(n => {
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

			if (!done) {
				tr.selectNodes([]).dispatch();
			}

			return
		}

		// const splitBlock = node.closest(n => n.canSplit);
		// node.chain.forEach(n => console.log(n.name, n.groups));
		const splitBlock = node.closest(n => n.type.splits);
		if (!splitBlock) {
			console.log('no split block in the chain', node.chain.map(n => n.name));
			return
		}
		console.log(`splitting block: ${splitBlock.name}`);

		const splitType = app.schema.type(splitBlock.type.splitName)
		if (!splitType) {
			console.warn('failed to split: ' + splitBlock.name);
			return
		}

		cmd.transform
			.split(splitBlock, selection, { splitType })?.dispatch();
	}

	delete(ctx: EventContext<KeyboardEvent>) {
		ctx.preventDefault();
		ctx.event.preventDefault();
		ctx.event.stopPropagation();

		console.log('xxxxxxx');

		const { event } = ctx;
		const { app, node } = ctx;
		const { selection, cmd, blockSelection: nodeSelection } = app;

		// delete node selection if any
		if (!nodeSelection.isEmpty) {
			cmd.transform.deleteNodes(nodeSelection, {fall: 'after'})?.dispatch();
			return
		}

		const { isCollapsed, head } = selection;
		console.log('xxx');
		if (!isCollapsed) {
			console.log('pppp');

			cmd.transform.delete()?.dispatch()
			return
		}

		if (head.isAtEndOfNode(node)) {
			const { start } = selection;
			const textBlock = start.node.chain.find(n => n.isTextBlock)
			const nextTextBlock = textBlock?.next(n => !n.isIsolating && n.isTextBlock, { skip: n => n.isIsolating });
			if (!nextTextBlock || !textBlock) return

			cmd.transform.merge(textBlock, nextTextBlock)?.dispatch();
			return
		}


		event.stopPropagation()
		console.log('Keyboard.backspace', selection.moveStart(1)?.toString());
		cmd.transform.delete(selection.moveStart(1)!)?.dispatch()
	}

	up(ctx: EventContext<KeyboardEvent>) {
		const { app, node } = ctx;
		const { blockSelection: nodeSelection } = app;
		if (nodeSelection.isEmpty) return

		ctx.event.preventDefault();

		if (nodeSelection.size > 1) {
			const { blocks: nodes } = nodeSelection
			const lastNode = first(nodes) as Node;
			app.tr.selectNodes([lastNode.id]).dispatch()
			return
		}

		const block = prevContainerBlock(node)
		if (!block || block.isRoot) return

		app.tr.selectNodes([block.id]).dispatch()
	}

	down(ctx: EventContext<KeyboardEvent>) {
		const {app, node} = ctx;
		const { blockSelection: nodeSelection } = app;
		if (nodeSelection.isEmpty) return
		ctx.event.preventDefault();

		if (nodeSelection.size > 1) {
			const {blocks: nodes} = nodeSelection
			const lastNode = last(nodes) as Node;
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
	const block = node.chain.find(n => n.isContainerBlock) as Node;
	const { prevSibling } = block
	if (prevSibling?.isContainerBlock) {
		const childContainer = prevSibling.find(n => {
			return !n.eq(prevSibling) && n.isContainerBlock
		}, { order: 'pre', direction: 'backward' })

		return childContainer ?? prevSibling;
	}

	if (block.parent?.isContainerBlock) {
		return node.parent
	}

	return block?.prev(n => n.isContainerBlock);
}

const nextContainerBlock = node => {
	const block = node.chain.find(n => n.isContainerBlock);
	return block.find(n => !n.eq(block) && n.isContainerBlock, { order: 'pre' }) ?? block?.next(n => n.isContainerBlock, { order: 'pre' });
}


