"use strict";
exports.__esModule = true;
exports.EventManager = void 0;
var EventContext_1 = require("./EventContext");
var is_hotkey_1 = require("is-hotkey");
var PinnedSelection_1 = require("./PinnedSelection");
var types_1 = require("./actions/types");
var Event_1 = require("./Event");
var Logger_1 = require("./Logger");
var lodash_1 = require("lodash");
var selectionKeys = [
    'left',
    'right',
    'shift+left',
    'shift+right'
];
var selectionChangedUsingKeys = function (event) {
    return selectionKeys.some(function (k) { return is_hotkey_1.isKeyHotkey(k)(event); });
};
var EventManager = /** @class */ (function () {
    function EventManager(app, pm) {
        this.app = app;
        this.pm = pm;
        this.clicks = 0;
    }
    Object.defineProperty(EventManager.prototype, "state", {
        get: function () {
            return this.app.state;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(EventManager.prototype, "runtime", {
        get: function () {
            return this.app.state.runtime;
        },
        enumerable: false,
        configurable: true
    });
    EventManager.prototype.onCustomEvent = function (event) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        return false;
    };
    EventManager.prototype.onEvent = function (type, event) {
        var _a;
        var app = this.app;
        // console.log(type, event);
        // without focus the editor does not process any event
        if (!app.enabled) {
            if (type === Event_1.EventsIn.selectstart) {
                event.preventDefault();
                console.log(Logger_1.p14('%c[skipped]'), 'color:#ffcc006e', 'editor is disabled for events');
            }
            // console.log('ignored event', type);
            return;
        }
        // type = this.beforeEvent(type, event);
        // if (type === EventsIn.noop) {
        // 	return
        // }
        // check if editor handles the event
        if (!this.pm.events.has(type)) {
            // console.log(this.pm.events, type, 'event is not handled');
            return;
        }
        if (type !== Event_1.EventsIn.selectionchange && app.state.selectedNodeIds.size > 0) {
            // console.log('selected nodes', app.state.selectedNodeIds);
            // console.log(type, event);
            var lastNode = lodash_1.last(app.state.selectedNodeIds.map(function (id) { return app.store.get(id); }));
            this.updateCommandOrigin(type, event);
            // TODO: check if this can be optimized
            var editorEvent_1 = EventContext_1.EventContext.create({
                type: type,
                event: event,
                app: this.app,
                node: lastNode,
                selection: PinnedSelection_1.PinnedSelection["default"](app.content),
                origin: EventContext_1.EventOrigin.dom
            });
            this.pm.onEvent(editorEvent_1);
            return;
        }
        // console.debug(p14('%c[debug]'),'color:magenta', 'Editor.currentSelection', this.selection.toString(),);
        var selection = PinnedSelection_1.PinnedSelection.fromDom(app.store);
        console.log(Logger_1.pad("%c >>> " + type + ": " + ((_a = event.key) !== null && _a !== void 0 ? _a : selection === null || selection === void 0 ? void 0 : selection.toString()), 100), 'background:#ffcc006e');
        // editor cannot process event without active selection
        if (!selection) {
            console.error(Logger_1.p12('%c[invalid]'), 'color:grey', type + ": event with empty selection");
            return;
        }
        // console.log('###', editor.selection.toString(), selection.toString(), editor.selection, selection);
        if (this.updateFocusPlaceholder(this.state.prevSelection, selection) && type === Event_1.EventsIn.selectionchange) {
            // this.changedContent()
        }
        // new dom selection is same as exiting editor.selection
        if (type === Event_1.EventsIn.selectionchange && app.selection.eq(selection)) {
            console.log(Logger_1.p14('%c[skipped]'), 'color:#ffcc006e', 'selection change');
            // return
        }
        // console.log('changing selection....', app.selection.toString(), selection.toString())
        // start node corresponds to focus point in DOM
        var node = selection.start.node;
        if (!node) {
            console.error(Logger_1.p12('%c[invalid]'), 'color:grey', 'node not found for event for selection', selection === null || selection === void 0 ? void 0 : selection.toString(), type);
            return;
        }
        this.updateCommandOrigin(type, event);
        var editorEvent = EventContext_1.EventContext.create({
            type: type,
            event: event,
            app: this.app,
            node: node,
            selection: selection,
            origin: EventContext_1.EventOrigin.dom
        });
        if (type == Event_1.EventsIn.selectionchange || selectionChangedUsingKeys(event)) {
            console.group('onEvent:', event.type);
        }
        else {
            console.group('onEvent:', event.type);
        }
        this.pm.onEvent(editorEvent);
        console.groupEnd();
        // this.afterEvent(editorEvent);
    };
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
    EventManager.prototype.updateFocusPlaceholder = function (before, after) {
        var isUpdated = false;
        if ((after === null || after === void 0 ? void 0 : after.isCollapsed) || !after) {
            var prevNode = before === null || before === void 0 ? void 0 : before.head.node;
            var currNode = after === null || after === void 0 ? void 0 : after.head.node;
            if (currNode && (prevNode === null || prevNode === void 0 ? void 0 : prevNode.eq(currNode)))
                return;
            if ((before === null || before === void 0 ? void 0 : before.isCollapsed) && (prevNode === null || prevNode === void 0 ? void 0 : prevNode.type.isTextBlock) || (prevNode === null || prevNode === void 0 ? void 0 : prevNode.isVoid)) {
                isUpdated = true;
                prevNode.updateAttrs({
                    html: {
                        'data-focused': 'false'
                    }
                });
            }
            if (!(currNode === null || currNode === void 0 ? void 0 : currNode.type.isTextBlock) || !(currNode === null || currNode === void 0 ? void 0 : currNode.isVoid))
                return isUpdated;
            isUpdated = true;
            currNode.updateAttrs({
                html: {
                    'data-focused': 'true'
                }
            });
        }
        return isUpdated;
    };
    // afterEvent(event: EditorEvent<Event>) {
    // 	const { type } = event;
    // 	if (type === EventsIn.mouseUp) {
    // 		// this.normalize();
    // 	}
    // }
    EventManager.prototype.updateCommandOrigin = function (type, event) {
        if (selectionChangedUsingKeys(event)) {
            this.runtime.origin = types_1.ActionOrigin.UserSelectionChange;
            return;
        }
        switch (type) {
            case Event_1.EventsIn.selectionchange:
                this.runtime.origin = types_1.ActionOrigin.DomSelectionChange;
                return;
            case Event_1.EventsIn.beforeinput:
            case Event_1.EventsIn.keyDown:
                this.runtime.origin = types_1.ActionOrigin.UserInput;
                return;
            default:
                break;
        }
    };
    return EventManager;
}());
exports.EventManager = EventManager;
