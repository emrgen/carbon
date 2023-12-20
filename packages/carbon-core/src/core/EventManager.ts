import { Carbon } from "./Carbon";
import { EventContext, EventOrigin } from "./EventContext";
import { PluginManager } from "./PluginManager";
import { isKeyHotkey } from "is-hotkey";
import { PinnedSelection } from "./PinnedSelection";
import { Node } from "./Node";
import { ActionOrigin } from "./actions/types";
import { EventsIn } from "./Event";
import { p12, p14, pad } from "./Logger";
import { last } from "lodash";
import { preventAndStop } from "../utils/event";
import { CustomEvent } from "./CustomEvent";

const selectionKeys: string[] = [
	'left',
	'right',
	'shift+left',
	'shift+right'
];

const selectionChangedUsingKeys = (event) => {
	return selectionKeys.some(k => isKeyHotkey(k)(event as any))
}

// EventManager is responsible for handling all dom/custom events and dispatching them to plugins
export class EventManager {

	event?: EventContext<Event>;
	clicks = 0;

	get state() {
		return this.app.state;
	}

	get runtime() {
		return this.app.runtime;
	}

	constructor(readonly app: Carbon, readonly pm: PluginManager) { }

	onCustomEvent(type: EventsIn, event: CustomEvent): boolean {
		const {app, } = this
		const ctx = EventContext.create({
			app,
			type,
			event: event.event,
			node: event.node,
			selection: app.selection,
			origin: EventOrigin.custom,
			cmd: app.cmd,
		})

		this.pm.onEvent(ctx);

		return false
	}

	onEvent(type: EventsIn, event: Event) {
		const { app } = this;
		// console.log(type, event);

		// type = this.beforeEvent(type, event);
		// if (type === EventsIn.noop) {
		// 	return
		// }

		if (event instanceof CustomEvent) {
			this.onCustomEvent(type, event);
			return
		}

		// check if editor handles the event
		if (!this.pm.events.has(type)) {
			// console.log(this.pm.events, type, 'event is not handled');
			return
		}

		// without focus the editor does not process any event
		if (!app.enabled) {
			if (type === EventsIn.selectstart) {
				event.preventDefault();
				console.log(p14('%c[skipped]'), 'color:#ffcc006e', 'editor is disabled for events');
			}
			console.log('app: disabled', ' ignored event', type);
			return
		}

		if (type == EventsIn.selectstart && app.dragging) {
			console.log('select start', app.dragging);
			preventAndStop(event);
			return
		}

		if (type !== EventsIn.selectionchange && app.state.selection.isBlock && app.selection.nodes.length) {
			const lastNode = last(app.selection.nodes) as Node;
			this.updateCommandOrigin(type, event);

			// TODO: check if this can be optimized
			const editorEvent = EventContext.create({
				type,
				event,
				app: this.app,
				node: lastNode,
				selection: PinnedSelection.IDENTITY,
				origin: EventOrigin.dom,
				cmd: app.cmd,
			});

			this.pm.onEvent(editorEvent);

			// if the transaction is not committed, discard it
			if (!editorEvent.cmd.committed) {
				// this.app.committed = true;
				console.log(p14('%c[skipped]'), 'color:#ffcc006e', 'EventManager.onEvent selectionchange');
				return
			}
			return
		}

		const selection = PinnedSelection.fromDom(app.store);
		if (['selectionchange'].includes(type)) {
			console.log(pad(`%c >>> ${type}: ${(event as any).key ?? selection?.toString()}`, 100), 'background:#ffcc006e');
		}

		// editor cannot process event without active selection
		if (!selection || selection.isBlock && !selection.nodes.length) {
			console.error(p12('%c[invalid]'), 'color:grey', `${type}: event with empty selection`);
			return
		}

		// new dom selection is same as exiting editor.selection
		if (type === EventsIn.selectionchange && app.selection.eq(selection)) {
			console.log(p14('%c[skipped]'), 'color:#ffcc006e', 'EventManager.onEvent selectionchange');
			return
		}

		// start node corresponds to focus point in DOM
		const node = selection.start.down().node;
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
			cmd: app.cmd,
		});


		let groupOpen = false;
		if (type !== EventsIn.keyDown) {
			if ([
				EventsIn.mouseDown,
				// EventsIn.selectionchange,
				// EventsIn.selectstart,
				// EventsIn.keyDown,
				EventsIn.keyUp,
				// EventsIn.input,
				// EventsIn.beforeinput,
			].includes(type) || selectionChangedUsingKeys(event)
			) {
				// console.groupCollapsed('onEvent:', event.type);
				groupOpen = true;
			} else {
				// console.groupCollapsed('onEvent:', event.type, editorEvent);
				groupOpen = true;
			}
		} else {
			// console.log('onEvent:', event);
		}

		this.pm.onEvent(editorEvent);
		if (groupOpen) {
			// console.groupEnd();
		}

		// if the transaction is not committed, discard it
		if (!editorEvent.cmd.committed) {
			this.app.committed = true;
			console.log(p14('%c[skipped]'), 'color:#ffcc006e', 'EventManager.onEvent selectionchange');
			return
		}

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
			case EventsIn.paste:
				this.runtime.origin = ActionOrigin.UserInput;
				return
			default:
				break;
		}
	}

}
