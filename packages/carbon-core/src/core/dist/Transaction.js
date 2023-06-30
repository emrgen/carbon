"use strict";
exports.__esModule = true;
exports.Transaction = exports.TransactionError = void 0;
var lodash_1 = require("lodash");
var Logger_1 = require("./Logger");
var BSet_1 = require("./BSet");
var Fragment_1 = require("./Fragment");
var types_1 = require("./actions/types");
var Select_1 = require("./actions/Select");
var InsertText_1 = require("./actions/InsertText");
var InsertNodes_1 = require("./actions/InsertNodes");
var ChangeName_1 = require("./actions/ChangeName");
var MoveAction_1 = require("./actions/MoveAction");
var RemoveNode_1 = require("./actions/RemoveNode");
var SetContent_1 = require("./actions/SetContent");
var SelectNodes_1 = require("./actions/SelectNodes");
var actions_1 = require("./actions");
var ActivateNodes_1 = require("./actions/ActivateNodes");
var UpdateAttrs_1 = require("./actions/UpdateAttrs");
var TransactionError = /** @class */ (function () {
    function TransactionError(commandId, error) {
        this.commandId = commandId;
        this.error = error;
    }
    Object.defineProperty(TransactionError.prototype, "message", {
        get: function () {
            return this.error.message;
        },
        enumerable: false,
        configurable: true
    });
    return TransactionError;
}());
exports.TransactionError = TransactionError;
var _id = 0;
var getId = function () { return _id++; };
var Transaction = /** @class */ (function () {
    function Transaction(app, tm, pm, sm) {
        this.app = app;
        this.tm = tm;
        this.pm = pm;
        this.sm = sm;
        this.isNormalizer = false;
        this.actions = [];
        this.undoActions = [];
        this.cancelled = false;
        this.committed = false;
        this.selections = [];
        this.normalizeIds = new BSet_1.NodeIdSet();
        this.updatedIds = new BSet_1.NodeIdSet();
        this.selectedIds = new BSet_1.NodeIdSet();
        this.activatedIds = new BSet_1.NodeIdSet();
        this.id = getId();
    }
    Object.defineProperty(Transaction.prototype, "origin", {
        get: function () {
            return this.app.runtime.origin;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Transaction.prototype, "state", {
        get: function () {
            return this.app.state;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Transaction.prototype, "runtime", {
        get: function () {
            return this.state.runtime;
        },
        enumerable: false,
        configurable: true
    });
    Transaction.create = function (carbon, tm, pm, sm) {
        return new Transaction(carbon, tm, pm, sm);
    };
    Object.defineProperty(Transaction.prototype, "updatesContent", {
        get: function () {
            return this.updatedIds.size;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Transaction.prototype, "updatesSelection", {
        get: function () {
            return !!this.selections.length;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Transaction.prototype, "updatesNodeState", {
        get: function () {
            return !!this.selectedIds.size || !!this.activatedIds.size;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Transaction.prototype, "selection", {
        // returns final selection
        get: function () {
            var _a, _b;
            var sel = (_b = (_a = lodash_1.last(this.selections)) === null || _a === void 0 ? void 0 : _a.clone()) !== null && _b !== void 0 ? _b : this.state.selection.unpin();
            // console.debug(p14('%c[debug]'), 'color:magenta','editor.selection', sel.toString());
            return sel;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Transaction.prototype, "cmd", {
        get: function () {
            return this.app.cmd;
        },
        enumerable: false,
        configurable: true
    });
    Transaction.prototype.onSelect = function (before, after, origin) {
        this.sm.onSelect(before, after, origin);
    };
    Transaction.prototype.select = function (selection, origin) {
        if (origin === void 0) { origin = this.origin; }
        var after = selection.unpin();
        // console.log('Transaction.select', after.toString(), this.selection.toString());
        this.add(Select_1.SelectAction.create(this.selection, after, origin));
        this.selections.push(after.clone());
        return this;
    };
    Transaction.prototype.setContent = function (id, content, origin) {
        if (origin === void 0) { origin = this.origin; }
        this.add(SetContent_1.SetContent.create(id, content, origin));
        return this;
    };
    Transaction.prototype.insert = function (at, nodes, origin) {
        if (origin === void 0) { origin = this.origin; }
        this.add(InsertNodes_1.InsertNodes.create(at, Fragment_1.Fragment.from(lodash_1.flatten([nodes])), origin));
        return this;
    };
    Transaction.prototype.insertText = function (at, text, native, origin) {
        if (native === void 0) { native = false; }
        if (origin === void 0) { origin = this.origin; }
        this.add(InsertText_1.InsertText.create(at, text, native, origin));
        return this;
    };
    Transaction.prototype.remove = function (at, id, origin) {
        if (origin === void 0) { origin = this.origin; }
        this.add(RemoveNode_1.RemoveNode.create(at, id, origin));
        return this;
    };
    Transaction.prototype.removeText = function (at, textNode, origin) {
        if (origin === void 0) { origin = this.origin; }
        this.add(actions_1.RemoveText.create(at, textNode, origin));
        return this;
    };
    Transaction.prototype.move = function (from, to, id, origin) {
        if (origin === void 0) { origin = this.origin; }
        this.add(MoveAction_1.MoveAction.create(from, to, id, origin));
        return this;
    };
    Transaction.prototype.change = function (id, from, to, origin) {
        if (origin === void 0) { origin = this.origin; }
        this.add(new ChangeName_1.ChangeName(id, from, to, origin));
        return this;
    };
    Transaction.prototype.mark = function (start, end, mark, origin) {
        if (origin === void 0) { origin = this.origin; }
        // this.add(MarkCommand.create(start, end, mark, origin))
        return this;
    };
    Transaction.prototype.updateAttrs = function (id, attrs, origin) {
        if (origin === void 0) { origin = this.origin; }
        console.log('xxxx');
        this.add(UpdateAttrs_1.UpdateAttrs.create(id, attrs, origin));
        return this;
    };
    Transaction.prototype.updateData = function (id, data, origin) {
        if (origin === void 0) { origin = this.origin; }
        // this.add(UpdateData.create(id, data, origin))
        return this;
    };
    // deactivate any active node before node selection
    Transaction.prototype.selectNodes = function (ids, origin) {
        if (origin === void 0) { origin = this.origin; }
        if (this.state.activatedNodeIds.size) {
            // this.add(ActivateNodeCommand.create([], origin));
        }
        this.add(SelectNodes_1.SelectNodes.create(ids, origin));
        return this;
    };
    // only selected nodes can be activated
    // first select and then activate nodes
    Transaction.prototype.activateNodes = function (ids, origin) {
        if (origin === void 0) { origin = this.origin; }
        this.add(SelectNodes_1.SelectNodes.create(ids, origin));
        this.add(ActivateNodes_1.ActivateNodes.create(ids, origin));
        return this;
    };
    Transaction.prototype.forceRender = function (ids, origin) {
        var _this = this;
        if (origin === void 0) { origin = this.origin; }
        ids.forEach(function (id) {
            var _a;
            (_a = _this.state.store.get(id)) === null || _a === void 0 ? void 0 : _a.markUpdated();
            _this.updatedIds.add(id);
            _this.state.runtime.updatedNodeIds.add(id);
        });
        return this;
    };
    Transaction.prototype.cancel = function () {
        this.cancelled = true;
    };
    // adds command to transaction
    Transaction.prototype.add = function (action) {
        var _this = this;
        var actions = [];
        if (lodash_1.isArray(action)) {
            actions = action;
        }
        else {
            actions = [action];
        }
        actions.forEach(function (c) { return _this.actions.push(c); });
        return this;
    };
    Transaction.prototype.dispatch = function (isNormalizer) {
        if (isNormalizer === void 0) { isNormalizer = false; }
        this.isNormalizer = isNormalizer;
        this.tm.dispatch(this);
    };
    Transaction.prototype.commit = function () {
        if (this.cancelled) {
            return false;
        }
        if (this.actions.length === 0 && this.updatedIds.size === 0)
            return false;
        // const prevDocVersion = editor.doc?.updateCount;
        try {
            if (this.actions.every(function (c) { return c.origin === types_1.ActionOrigin.Runtime; })) {
                console.groupCollapsed('Transaction (runtime)');
            }
            else {
                console.group('Transaction');
            }
            for (var _i = 0, _a = this.actions; _i < _a.length; _i++) {
                var action = _a[_i];
                console.log(Logger_1.p14('%c[command]'), "color:white", action.toString());
                var _b = action.execute(this), ok = _b.ok, error = _b.error;
                if (!ok) {
                    this.error = new TransactionError(action.id, error);
                }
                if (this.error) {
                    this.rollback();
                }
                // this.undoCommands.push(undo.unwrap());
            }
            console.groupEnd();
            // const onlySelectionChanged = this.commands.every(c => c instanceof SelectCommand)
            // if (!onlySelectionChanged) {
            // normalize after transaction command
            // this way the merge will happen before the final selection
            this.normalizeNodes();
            this.committed = true;
            // console.log(this.editor.doc.textContent);
            return true;
        }
        catch (error) {
            console.groupEnd();
            console.error(error);
            this.rollback();
            return false;
        }
    };
    // can generate further transaction
    Transaction.prototype.normalizeNodes = function () {
        var _this = this;
        var ids = this.normalizeIds.toArray();
        if (!ids.length)
            return [];
        var nodes = ids
            .map(function (id) { return _this.app.store.get(id); })
            .filter(lodash_1.identity);
        var sortedNodes = lodash_1.sortBy(nodes, function (n) { return -n.depth; });
        var commands = sortedNodes
            .map(function (n) { return n && _this.pm.normalize(n, _this.app).forEach(function (action) {
            _this.actions.push(action);
            action.execute(_this);
        }); });
    };
    Transaction.prototype.abort = function (message) {
        console.log(Logger_1.p14('%c[abort]'), 'color:red', 'transaction, error:', message);
        this.cancelled = true;
    };
    Transaction.prototype.rollback = function () {
        var error = this.error;
        if (!error) {
            console.info(Logger_1.p14('%c[info]'), 'color:red', 'transaction aborted without error');
            return;
        }
        console.log(Logger_1.p14('%c[error]'), 'color:red', error.message, '-> rolling back transaction');
        // rollback transaction changes
        // put the cursor at the right place
    };
    // addSelection(selection: Selection) {
    // 	this.selections.push(selection);
    // }
    // normalize the updated nodes in this transaction
    Transaction.prototype.normalize = function () {
        var _this = this;
        var nodes = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            nodes[_i] = arguments[_i];
        }
        nodes.forEach(function (n) { return n.chain.forEach(function (n) {
            _this.normalizeIds.add(n.id);
        }); });
    };
    Transaction.prototype.updated = function () {
        var _this = this;
        var nodes = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            nodes[_i] = arguments[_i];
        }
        // console.log('pending updates', nodes.map(n => n.id.toString()));
        lodash_1.each(nodes, function (n) {
            _this.updatedIds.add(n.id);
            _this.runtime.updatedNodeIds.add(n.id);
            // all the parent draggables are updated also
            // may be on blur render all can be better approach
            // let draggable: Optional<Node> = n;
            // while (draggable = draggable?.closest(p => p.type.isDraggable || p.type.isSandbox)!) {
            // 	if (draggable.type.isSandbox) break
            // 	this.runtime.updatedNodeIds.add(draggable.id)
            // 	draggable = draggable.parent;
            // }
        });
    };
    Transaction.prototype.selected = function () {
        var _this = this;
        var nodes = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            nodes[_i] = arguments[_i];
        }
        // console.log('Transaction.selected', nodes.map(n => n.id.toString()));
        lodash_1.each(nodes, function (n) {
            _this.selectedIds.add(n.id);
            _this.runtime.selectedNodeIds.add(n.id);
        });
    };
    Transaction.prototype.activated = function () {
        var _this = this;
        var nodes = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            nodes[_i] = arguments[_i];
        }
        // console.log('Transaction.activated', nodes.map(n => n.id.toString()));
        lodash_1.each(nodes, function (n) {
            _this.activatedIds.add(n.id);
            _this.runtime.activatedNodeIds.add(n.id);
        });
    };
    // merge transactions
    // * Note: current transaction is mutated
    Transaction.prototype.merge = function (tr) {
        // if (last(this.actions) instanceof SelectCommand) {
        // 	this.pop()
        // }
        var _a, _b;
        (_a = this.actions).push.apply(_a, tr.actions);
        (_b = this.selections).push.apply(_b, tr.selections);
        return this;
    };
    Transaction.prototype.pop = function () {
        var cmd = this.actions.pop();
        // if popped command is selection command restore previous selection
        // if (cmd instanceof SelectCommand) {
        // 	this.selections.pop()
        // }
        return this;
    };
    return Transaction;
}());
exports.Transaction = Transaction;
