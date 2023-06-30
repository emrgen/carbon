"use strict";
exports.__esModule = true;
exports.SelectionManager = void 0;
var lodash_1 = require("lodash");
var Logger_1 = require("./Logger");
var types_1 = require("./actions/types");
var SelectionEvent_1 = require("./SelectionEvent");
var Event_1 = require("./Event");
var SelectionManager = /** @class */ (function () {
    function SelectionManager(app) {
        this.app = app;
        this.focused = false;
    }
    Object.defineProperty(SelectionManager.prototype, "runtime", {
        get: function () {
            return this.app.runtime;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(SelectionManager.prototype, "state", {
        get: function () {
            return this.app.state;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(SelectionManager.prototype, "enabled", {
        get: function () {
            return this.app.enabled;
        },
        enumerable: false,
        configurable: true
    });
    SelectionManager.prototype.focus = function () {
        var _a;
        (_a = this.app.element) === null || _a === void 0 ? void 0 : _a.focus();
        this.focused = true;
    };
    SelectionManager.prototype.blur = function () {
        var _a;
        (_a = this.app.element) === null || _a === void 0 ? void 0 : _a.blur();
        this.focused = false;
    };
    // syncs selection with dom depending on `origin`
    // used by commands to inform editor of a selection change
    // the selection might be queued
    SelectionManager.prototype.onSelect = function (before, after, origin) {
        if (!this.enabled) {
            return;
        }
        var app = this.app;
        // const { head, tail } = after.pin(editor)!;
        // const selectedNodes = this.state.selectedNodeIds.map(id => this.store.get(id)) as Node[];
        // selectedNodes.forEach((n) => {
        // 	if (n.isActive) return
        // 	n.updateData({ _state: { selected: false } });
        // 	this.state.runtime.selectedNodeIds.add(n.id);
        // });
        // console.log('Editor.onSelect', after.toString(), this.runtime.selectEvents.length);
        console.debug('Editor.onSelect', after.toString(), 'pendingSelection', origin);
        if ([types_1.ActionOrigin.UserSelectionChange, types_1.ActionOrigin.DomSelectionChange].includes(origin)) {
            if (app.runtime.selectEvents.length === 0) {
                // this.selectedNodesIds.clear();
                this.onSelectionChange(before, after, origin);
                // this.selectedNodesChanged()
                // this.pm.onSelect(event);
            }
            else {
                console.error('skipped the selection', after.toString(), before.toString());
            }
        }
        else {
            var event = SelectionEvent_1.SelectionEvent.create(before, after, origin);
            this.runtime.selectEvents.push(event);
        }
    };
    //
    SelectionManager.prototype.onSelectionChange = function (before, after, origin) {
        var state = this.state;
        if (before.eq(after) && origin !== types_1.ActionOrigin.UserInput && origin !== types_1.ActionOrigin.Normalizer && origin !== types_1.ActionOrigin.UserSelectionChange) {
            console.info(Logger_1.p14('%c[info]'), 'color:pink', 'before and after selection same', before.toJSON(), after.toJSON());
            return;
        }
        var selection = after.pin(state.store);
        if (!selection) {
            console.error(Logger_1.p12('%c[error]'), 'color:red', 'updateSelection', 'failed to get next selection');
            return;
        }
        // console.log('synced selection from origin', origin)
        this.state.updateSelection(selection, origin, origin === types_1.ActionOrigin.DomSelectionChange);
        this.app.emit(Event_1.EventsOut.selectionchanged, selection);
        this.app.change.update();
    };
    // syncs DOM selection with Editor's internal selection state
    // this must be called after the dom is updated
    SelectionManager.prototype.syncSelection = function () {
        var _a, _b;
        if (!this.enabled) {
            return;
        }
        if (this.state.selectionSynced) {
            console.log('skipped: selection already synced', this.state.selectionOrigin);
            return;
        }
        var app = this.app;
        var selection = this.state.selection;
        if (((_a = this.state.prevSelection) === null || _a === void 0 ? void 0 : _a.eq(selection)) && this.state.selectionOrigin === types_1.ActionOrigin.DomSelectionChange) {
            console.log('skipped: unchanged selection sync', this.state.selectionOrigin);
            return;
        }
        if (selection.isInvalid) {
            console.warn('skipped invalid selection sync');
            (_b = app.element) === null || _b === void 0 ? void 0 : _b.blur();
            this.state.selectionSynced = true;
            return;
        }
        selection.syncDom(app.store);
        this.state.selectionSynced = true;
    };
    SelectionManager.prototype.commitSelection = function () {
        var app = this.app;
        var event = lodash_1.last(this.runtime.selectEvents);
        if (!event) {
            return;
        }
        this.runtime.selectEvents = [];
        var after = event.after;
        var selection = after.pin(app.store);
        if (!selection) {
            console.error(Logger_1.p12('%c[error]'), 'color:red', 'commitSelection', 'failed to get next selection');
            return;
        }
        this.state.updateSelection(selection, event.origin);
        this.app.emit(Event_1.EventsOut.selectionchanged, selection);
    };
    return SelectionManager;
}());
exports.SelectionManager = SelectionManager;
