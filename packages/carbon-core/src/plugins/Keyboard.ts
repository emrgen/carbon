import { EventHandler, EventHandlerMap } from "../core/types";
import { p14 } from "../core/Logger";
import { AfterPlugin, BeforePlugin, CarbonPlugin } from '../core/CarbonPlugin';
import { EventContext } from "../core/EventContext";
import { SelectionCommands } from "./SelectionCommands";
import { IsolatingPlugin } from "./Isolating";
import { TransformCommands } from "./TransformCommands";
import { skipKeyEvent } from "../utils/key";
import { first, last, reverse } from "lodash";
import { ActionOrigin, BlockContent, Carbon, InlineContent, MoveAction, Node, Pin, PinnedSelection, Point, Transaction } from "../core";
import { hasParent, nodePath } from "../utils/node";
import { CommandPlugin, insertAfterAction, preventAndStopCtx } from '@emrgen/carbon-core';
import { nodeLocation } from '../utils/location';
import { BlockSelection } from "../core/NodeSelection";
import { Optional } from '@emrgen/types';


declare module '@emrgen/carbon-core' {
	export interface CarbonCommands {
		keyboard: {
			backspace(ctx: EventContext<KeyboardEvent>): Optional<Transaction>;
		};
	}
}

export class KeyboardCommandPlugin extends BeforePlugin {
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
				const { app, node } = ctx;
				const { selection } = app;
				const { start, end } = selection;
				const isolating = start.node.find(n => n.isIsolating);
				if (!isolating) {
					return
				}

				if (hasParent(node, isolating)) {
					return
				}

			},
			beforeInput: (ctx: EventContext<KeyboardEvent>) => {
				if (ctx.app.blockSelection.size) {
					preventAndStopCtx(ctx);
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
			new KeyboardCommandPlugin(),
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

				const block = node.chain.find(n => n.isBlockSelectable);
				if (!block) return
				app.tr.selectNodes([block.id]).dispatch();
			},
			left: (ctx: EventContext<KeyboardEvent>) => {
				console.log('XXXX');

				const { app, event, node } = ctx;
				const { selection, cmd, state, blockSelection } = app;
				const { selectedNodeIds } = state
				event.preventDefault();

				// nodes selection is visible using halo
				if (blockSelection.size) {
					this.collapseSelectionBeforeBlockSelection(app, blockSelection);
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
					this.collapseSelectionAfterBlockSelection(app, nodeSelection);
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
					const { parent } = node;
					if (parent?.isSandbox) return
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
			down: e => this.down(e),

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

	collapseSelectionBeforeBlockSelection(app: Carbon, blockSelection: BlockSelection) {
		const { blocks: nodes } = blockSelection;
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

	collapseSelectionAfterBlockSelection(app: Carbon, blockSelection: BlockSelection) {
		const lastNode = last(blockSelection.blocks)!;
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
	}


	shiftUp(ctx: EventContext<KeyboardEvent>) {
		const { app, node } = ctx;
		const { blockSelection: nodeSelection } = app;

		if (nodeSelection.isEmpty) return

		const { blocks: nodes } = nodeSelection;
		const firstNode = nodes[0] as Node;
		const block = prevBlockSelectable(firstNode);
		console.log(block?.id, firstNode.id, nodes.map(n => n.id.toString()));
		if (!block) {
			ctx.event.preventDefault()
			ctx.stopPropagation()
			return
		}

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
		const block = nextBlockSelectable(firstNode)
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
		ctx.stopPropagation();
		const { app } = ctx;
		const { selection, cmd, blockSelection } = app;
		const { start, end } = selection
		const { node } = start;
		let tr = app.tr;

		// put the cursor at the end of the first text block
		if (!blockSelection.isEmpty) {
			console.log('node selection...');
			const { blocks: nodes } = blockSelection;
			console.log(nodes.map(n => n.id.toString()));
			const lastNode = last(nodes) as Node;
			if (lastNode.hasFocusable) {
				const textBlock = lastNode.find(n => n.isFocusable);
				// if there is a text block, put the cursor at the end of the text block
				if (textBlock) {
					const pin = Pin.toEndOf(textBlock)!
					tr
						.selectNodes([])
						.select(PinnedSelection.fromPin(pin))
						.dispatch();
					return true
				}
			}

			const done = lastNode.nextSiblings.some(n => {
				if (n.hasFocusable) {
					const focusable = n.find(n => n.isFocusable);
					const pin = Pin.toStartOf(focusable!)!
					tr
						.selectNodes([])
						.select(PinnedSelection.fromPin(pin))
						.dispatch();
					return true
				}
			});
			if (done) return true

			console.log('no text block...');
			const lastBlock = last(nodes) as Node;
			const section = app.schema.type('section')?.default();
			if (!section) return false

			const after = PinnedSelection.fromPin(Pin.toStartOf(section)!)!;
			tr
				.selectNodes([])
				.add(insertAfterAction(lastBlock, section))
				.select(after, ActionOrigin.UserInput)
				.dispatch();

			return
		}

		// const splitBlock = node.closest(n => n.canSplit);
		// node.chain.forEach(n => console.log(n.name, n.groups));
		const splitBlock = node.closest(n => n.type.splits);
		const nonSplit = node.closest(n => n.isContainerBlock && !n.type.splits);

		// if (nonSplit && splitBlock && nonSplit.depth > splitBlock.depth) {
		// 	ctx.event.preventDefault();
		// 	ctx.event.stopPropagation();
		// 	return
		// }

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
			cmd.transform.deleteNodes(nodeSelection, { fall: 'after' })?.dispatch();
			return
		}

		const { isCollapsed, head } = selection;
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

		const block = prevBlockSelectable(node)
		if (!block || block.isDocument) return

		app.tr.selectNodes([block.id]).dispatch()
	}

	down(ctx: EventContext<KeyboardEvent>) {
		const { app, node } = ctx;
		const { blockSelection: nodeSelection } = app;
		if (nodeSelection.isEmpty) return
		ctx.event.preventDefault();

		if (nodeSelection.size > 1) {
			const { blocks: nodes } = nodeSelection
			const lastNode = last(nodes) as Node;
			app.tr.selectNodes([lastNode.id]).dispatch()
			return
		}

		const block = nextBlockSelectable(node)
		console.log('nextContainerBlock', block);
		if (!block) return

		app.tr.selectNodes([block.id]).dispatch()
	}
}

const prevBlockSelectable = (node: Node) => {
	const block = node.chain.find(n => n.isContainerBlock) as Node;
	const { prevSibling } = block
	if (prevSibling?.isContainerBlock) {
		const childContainer = prevSibling.find(n => {
			return !n.eq(prevSibling) && !n.isCollapseHidden && n.isBlockSelectable
		}, { order: 'post', direction: 'backward' })

		return childContainer ?? prevSibling;
	}

	if (block.parent?.isBlockSelectable) {
		return node.parent
	}

	return block?.prev(n => n.isBlockSelectable);
}

const nextBlockSelectable = node => {
	const block: Optional<Node> = node.chain.find(n => n.isBlockSelectable);
	const found = block?.find(n => {
		return !n.eq(block) && !n.isCollapseHidden && n.isBlockSelectable
	}, { order: 'pre' })

	if (found) return found;

	console.log('xxxxxx', block?.id.toString());


	return block?.next(n => n.isBlockSelectable, { order: 'pre' });
}


