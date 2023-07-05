import { Carbon } from "./Carbon";
import { EventContext, EventOrigin } from "./EventContext";
import { PluginManager } from "./PluginManager";
import { isKeyHotkey, isHotkey } from 'is-hotkey';
import { PinnedSelection } from "./PinnedSelection";
import { Node } from "./Node";
import { ActionOrigin } from "./actions/types";
import { EventsIn } from "./Event";
import { p12, p14, pad } from "./Logger";
import { last } from "lodash";

const selectionKeys: string[] = [
	'left',
	'right',
	'shift+left',
	'shift+right'
];

const selectionChangedUsingKeys = (event) => {
	return selectionKeys.some(k => isKeyHotkey(k)(event as any))
}

export class EventManager {

	event?: EventContext<Event>;
	clicks = 0;

	get state() {
		return this.app.state;
	}

	get runtime() {
		return this.app.state.runtime;
	}

	constructor(readonly app: Carbon, readonly pm: PluginManager) { }

	onCustomEvent(event: any, ...args): boolean {
		return false
	}

	onEvent(type: EventsIn, event: Event) {
		const { app } = this;
		// console.log(type, event);

		// without focus the editor does not process any event
		if (!app.enabled) {
			if (type === EventsIn.selectstart) {
				event.preventDefault();
				console.log(p14('%c[skipped]'), 'color:#ffcc006e', 'editor is disabled for events');
			}
			// console.log('ignored event', type);
			return
		}

		// type = this.beforeEvent(type, event);
		// if (type === EventsIn.noop) {
		// 	return
		// }

		// check if editor handles the event
		if (!this.pm.events.has(type)) {
			// console.log(this.pm.events, type, 'event is not handled');
			return
		}


		if (type !== EventsIn.selectionchange && app.state.selectedNodeIds.size > 0) {
			// console.log('selected nodes', app.state.selectedNodeIds);
			// console.log(type, event);

			const lastNode = last(app.state.selectedNodeIds.map(id => app.store.get(id))) as Node;
			this.updateCommandOrigin(type, event);

			// TODO: check if this can be optimized
			const editorEvent = EventContext.create({
				type,
				event,
				app: this.app,
				node: lastNode,
				selection: PinnedSelection.default(app.content),
				origin: EventOrigin.dom,
			});
			this.pm.onEvent(editorEvent);
			return
		}

		// console.debug(p14('%c[debug]'),'color:magenta', 'Editor.currentSelection', this.selection.toString(),);
		const selection = PinnedSelection.fromDom(app.store);
		if (['selectionchange'].includes(type)) {
			console.log(pad(`%c >>> ${type}: ${(event as any).key ?? selection?.toString()}`, 100), 'background:#ffcc006e');
		}
		// editor cannot process event without active selection
		if (!selection) {
			console.error(p12('%c[invalid]'), 'color:grey', `${type}: event with empty selection`);
			return
		}

		// console.log('###', editor.selection.toString(), selection.toString(), editor.selection, selection);
		if (this.updateFocusPlaceholder(this.state.prevSelection, selection) && type === EventsIn.selectionchange) {
			// this.changedContent()
		}

		// new dom selection is same as exiting editor.selection
		if (type === EventsIn.selectionchange && app.selection.eq(selection)) {
			console.log(p14('%c[skipped]'), 'color:#ffcc006e', 'selection change');
			// return
		}

		// console.log('changing selection....', app.selection.toString(), selection.toString())
		// start node corresponds to focus point in DOM
		const node = selection.start.node;
		if (!node) {
			console.error(p12('%c[invalid]'), 'color:grey', 'node not found for event for selection', selection?.toString(), type);
			return
		}

		this.updateCommandOrigin(type, event);
		const editorEvent = EventContext.create({
			type,
			event,
			app: this.app,
			node,
			selection: selection,
			origin: EventOrigin.dom,
		});

		if ([
			EventsIn.selectionchange,
			EventsIn.selectstart,
			EventsIn.mouseDown,
			EventsIn.keyUp,
		].includes(type) || selectionChangedUsingKeys(event)
		) {
			console.groupCollapsed('onEvent:', event.type);
		} else {
			console.group('onEvent:', event.type);
		}

		this.pm.onEvent(editorEvent);


		console.groupEnd()

		// this.afterEvent(editorEvent);
	}

	// clickTimer: any = null
	// beforeEvent(type: EventsIn, event: Event): EventsIn {
	// 	const { app } = this;
	// 	const { selection } = app;
	// 	if (isKeyHotkey('shift+left')(event)) {
	// 		if (selection.isCollapsed && selection.head.isAtDocStart) {
	// 			event.preventDefault()
	// 			return EventsIn.noop
	// 		}
	// 	}

	// 	if (isKeyHotkey('shift+right')(event)) {
	// 		if (selection.isCollapsed && selection.head.isAtDocEnd) {
	// 			event.preventDefault()
	// 			return EventsIn.noop
	// 		}
	// 	}

	// 	if (isKeyHotkey('right')(event)) {
	// 		if (selection.isCollapsed && selection.head.isAtDocEnd) {
	// 			event.preventDefault()
	// 			return EventsIn.noop
	// 		}
	// 	}

	// 	if (isKeyHotkey('left')(event)) {
	// 		// if (selection.isCollapsed && selection.head.isAtDocStart) {
	// 		// 	event.preventDefault()
	// 		// 	return EditorEventsIn.noop
	// 		// }
	// 	}

	// 	if (type === EventsIn.blur) {
	// 		app.state.updateSelection(PinnedSelection.default(app.content), this.runtime.origin, true)
	// 		// this.focused = false
	// 		return EventsIn.noop
	// 	}

	// 	if (type === EventsIn.focus) {
	// 		// this.focused = true
	// 	}

	// 	// handle custom double/triple clicks
	// 	if (type === EventsIn.mouseDown) {
	// 		clearTimeout(this.clickTimer);
	// 		this.clickTimer = setTimeout(() => {
	// 			this.clicks = 0
	// 		}, 400)

	// 		const clicks = ++this.clicks;

	// 		if (clicks >= 3) {
	// 			this.clicks = 0;
	// 			return EventsIn.tripleclick;
	// 		}

	// 		if (clicks > 1) {
	// 			// event.preventDefault()
	// 			return EventsIn.doubleclick;
	// 		}
	// 	}

	// 	return type;
	// }

	// update placeholder visibility for the focus node
	private updateFocusPlaceholder(before?: PinnedSelection, after?: PinnedSelection,) {
		let isUpdated = false
		if (after?.isCollapsed || !after) {
			const prevNode = before?.head.node;
			const currNode = after?.head.node
			if (currNode && prevNode?.eq(currNode)) return

			if (before?.isCollapsed && prevNode?.type.isTextBlock || prevNode?.isVoid) {
				isUpdated = true
				prevNode.updateAttrs({
					html: {
						'data-focused': 'false'
					}
				})
			}

			if (!currNode?.type.isTextBlock || !currNode?.isVoid) return isUpdated
			isUpdated = true
			currNode.updateAttrs({
				html: {
					'data-focused': 'true'
				}
			})
		}

		return isUpdated
	}

	// afterEvent(event: EditorEvent<Event>) {
	// 	const { type } = event;
	// 	if (type === EventsIn.mouseUp) {
	// 		// this.normalize();
	// 	}

	// }

	private updateCommandOrigin(type: EventsIn, event: Event) {
		if (selectionChangedUsingKeys(event)) {
			this.runtime.origin = ActionOrigin.UserSelectionChange;
			return
		}

		switch (type) {
			case EventsIn.selectionchange:
				this.runtime.origin = ActionOrigin.DomSelectionChange;
				return
			case EventsIn.beforeinput:
			case EventsIn.keyDown:
				this.runtime.origin = ActionOrigin.UserInput;
				return
			default:
				break;
		}
	}

}
