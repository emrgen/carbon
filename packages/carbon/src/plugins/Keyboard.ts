import { EventHandlerMap } from "../core/types";
import { p14 } from "../core/Logger";
import { AfterPlugin, BeforePlugin, CarbonPlugin } from '../core/Plugin';
import { EventContext } from "../core/EventContext";

// handles general keyboard events
// node specific cases are handles in node specific plugin
export class KeyboardPlugin extends AfterPlugin {

	name = 'keyboard'

	priority = 10001;

	on(): EventHandlerMap {
		return {
			selectstart: (ctx: EventContext<KeyboardEvent>) => {
				// console.log(event)
				// event.preventDomDefault();
			},
			beforeInput: (ctx: EventContext<KeyboardEvent>) => {
				const { node, event } = ctx;
				if(node.isAtom) {
					event.preventDefault()
					return
				}
				// console.log(p14('%c[insert]'), 'color:green', 'text node by keypress');
			}
		}
	}

	plugins(): CarbonPlugin[] {
		return [
			// new SelectionCommands(),
			// new TransformCommands(),
			// new KeyboardPrevent(),
		]
	}


	keydown(): EventHandlerMap {
		return {
			left: (ctx: EventContext<KeyboardEvent>) => {
				const { app, event } = ctx;
				const { selection, cmd } = app;
				event.preventDefault();

				if (!selection.isCollapsed) {
					// cmd.selection.collapseToTail()
					return
				}

				const after = selection.moveBy(-1)
				app.tr.select(after!).dispatch();
			},

			right: (ctx: EventContext<KeyboardEvent>) => {
				const { app, event } = ctx;
				const { selection, cmd } = app;
				event.preventDefault();

				if (!selection.isCollapsed) {
					// cmd.selection.collapseToHead()
					return
				}

				const after = selection.moveBy(1);
				console.log('#>', after?.toString());
				app.tr.select(after!).dispatch()
			},

			// 'shift+right': (ctx: EventContext<KeyboardEvent>) => {
			// 	event.preventDomDefault();
			// 	const { editor } = event;
			// 	const { selection: before, tr } = editor;
			// 	if (before.head.isAtDocEnd) {
			// 		event.stopPropagation();
			// 		return
			// 	}

			// 	const after = before.moveHead(1);
			// 	tr.select(after!).dispatch();
			// },

			// 'shift+left': (event: EditorEvent<KeyboardEvent>) => {
			// 	event.preventDomDefault();
			// 	const { editor } = event;
			// 	const { selection: before, tr } = editor;

			// 	const after = before.moveHead(-1);
			// 	tr.select(after!).dispatch();
			// },

			// 'shift+delete': (event) => this.delete(event),
			// delete: (event) => this.delete(event),

			// 'shift+backspace': e => this.backspace(e),
			// backspace: e => this.backspace(e),

			// 'shift+enter': e => this.enter(e),
			// enter: e => this.enter(e),

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

	// handles enter event
	// enter(ctx: EventContext<KeyboardEvent>) {
	// 	console.log('Enter event...');

	// 	event.preventDomDefault();
	// 	const { editor, node } = event;
	// 	const { selection, cmd } = editor;
	// 	if (!selection.isCollapsed) {
	// 		cmd.transform.delete()?.dispatch()
	// 		return
	// 	}

	// 	const splitBlock = node.closest(n => n.canSplit);
	// 	if (!splitBlock) return

	// 	cmd.transform.split(splitBlock, selection.head)?.dispatch()
	// }

	// delete(event: EditorEvent<KeyboardEvent>) {
	// 	event.preventDomDefault();
	// 	event.preventDefault();
	// 	const { editor, node } = event;

	// 	const { selection } = editor;
	// 	const { isCollapsed, head } = selection;
	// 	if (!isCollapsed) {
	// 		event.stopPropagation();
	// 		editor.cmd.transform.delete()?.dispatch()
	// 		return
	// 	}

	// 	if (head.isAtEndOfNode(node)) {
	// 		const prevNode = node.next(n => {
	// 			return !n.isSelectable || n.isFocusable
	// 		})
	// 		// console.log(prevNode?.name, prevNode?.isSelectable);
	// 		if (prevNode && !prevNode?.isSelectable) {
	// 			return
	// 		}
	// 	}

	// 	event.stopPropagation()
	// 	console.log('Keyboard.backspace', selection.moveStart(1)?.toString());
	// 	// editor.cmd.transform.delete(selection.moveStart(1)!)?.dispatch()
	// }

	// backspace(event: EditorEvent<KeyboardEvent>) {
	// 	event.preventDomDefault();
	// 	event.preventDefault();
	// 	const { editor, node } = event;

	// 	const { selection } = editor;
	// 	const {isCollapsed, head} = selection;
	// 	if (!isCollapsed) {
	// 		event.stopPropagation();
	// 		editor.cmd.transform.delete()?.dispatch()
	// 		return
	// 	}

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

	// 	const deleteSel = selection.moveStart(-1);
	// 	if (!deleteSel) return

	// 	// find lowest empty that can be deleted without violating the parent schema
	// 	const list = node.closest(isListNode)
	// 	if (list?.isEmpty && selection.head.isAtStartOfNode(list)) {
	// 		editor.tr
	// 			.add(DeleteCommand.create([list.id]))
	// 			.select(deleteSel.collapseToHead())
	// 			.dispatch()
	// 		return
	// 	}

	// 	// check if deleteSel head and tail are merge compatible

	// 	console.log('Keyboard.backspace',deleteSel.toString());
	// 	editor.cmd.transform.delete(deleteSel)?.dispatch()
	// }
}


// prevent default inputs from key press
export class KeyboardPrevent extends BeforePlugin {
	name = 'preventDefaultKey';

	priority = 10**4 + 500;

	on(): EventHandlerMap {
		return {
			beforeInput: (ctx) => {
				ctx.event.preventDefault()
			},
		}
	}

	keydown(): EventHandlerMap {
		return {
			// tab: e => e.event.preventDefault(),
			// left: e => this.reachedStart(e, true),
			// right: e => this.reachedEnd(e, true),
			// up: e => this.reachedStart(e),
			// down: e => this.reachedEnd(e),
			// // 'shift+left': e => this.reachedStart(e, true),
			// // 'shift+right': e => this.reachedEnd(e, true),
			// 'shift+up': e => this.reachedStart(e),
			// 'shift+down': e => this.reachedEnd(e),
		// 	backspace: event => {
		// 		event.preventDefault();
		// 		event.preventDefault();
		// 		const { editor } = event;
		// 		const { isCollapsed, head } = editor.selection;
		// 		if (!isCollapsed) return

		// 		if (head.isAtStartOfNode(editor.content)) {
		// 			event.stopPropagation()
		// 			return
		// 		}
		// 	},
		// 	delete: event => {
		// 		event.preventDomDefault();
		// 		event.preventDefault();
		// 		const { editor  } = event;
		// 		const { isCollapsed, head } = editor.selection;
		// 		if (!isCollapsed) return

		// 		if (head.isAtEndOfNode(editor.content)) {
		// 			event.stopPropagation()
		// 			return
		// 		}
		// 	}
		}
	}

	// reachedStart(event: EditorEvent<Event>, isCollapsed = false) {
		// const {editor} = event;
		// const {selection} = editor;
		// if (selection.head.isAtDocStart && selection.isCollapsed === isCollapsed) {
		// 	if (editor.element) {
		// 		editor.element.scrollTop = 0;
		// 	}
		// 	event.preventDomDefault();
		// 	event.stopPropagation();
		// 	return
		// }
	// }

	// reachedEnd(event: EditorEvent<Event>, isCollapsed = false) {
	// 	const { editor } = event;
	// 	const { selection } = editor;
	// 	if (selection.head.isAtDocEnd && selection.isCollapsed === isCollapsed) {
	// 		event.preventDomDefault();
	// 		event.stopPropagation();
	// 		return
	// 	}
	// }
}
