"use strict";
exports.__esModule = true;
exports.TransactionManager = void 0;
var Event_1 = require("./Event");
var TransactionManager = /** @class */ (function () {
    function TransactionManager(app, pm, sm) {
        this.app = app;
        this.pm = pm;
        this.sm = sm;
        this.transactions = [];
    }
    Object.defineProperty(TransactionManager.prototype, "state", {
        get: function () {
            return this.app.state;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(TransactionManager.prototype, "store", {
        get: function () {
            return this.app.state.store;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(TransactionManager.prototype, "runtime", {
        get: function () {
            return this.app.runtime;
        },
        enumerable: false,
        configurable: true
    });
    // empty dispatch tries to process pending transactions
    TransactionManager.prototype.dispatch = function (tr) {
        if (tr) {
            this.transactions.push(tr);
        }
        this.processTransactions();
    };
    TransactionManager.prototype.processTransactions = function () {
        var _a = this, app = _a.app, pm = _a.pm;
        // allow transactions to run only when there is no pending selection events
        // normalizer transactions are allowed to commit even with pending selection events
        while (this.transactions.length && (!this.runtime.selectEvents.length || this.transactions[0].isNormalizer)) {
            var tr = this.transactions.shift();
            console.log(tr);
            if (tr === null || tr === void 0 ? void 0 : tr.commit()) {
                pm.onTransaction(tr);
                app.emit(Event_1.EventsOut.transaction, tr);
                this.updateTransactionEffects(tr);
            }
        }
    };
    TransactionManager.prototype.updateTransactionEffects = function (tr) {
        if (tr.updatesContent) {
            this.commitContent();
        }
        if (tr.updatesNodeState) {
            this.commitNodeStates();
        }
        if (tr.updatesSelection) {
            this.commitSelection();
        }
        this.app.change.update();
        this.app.emit(Event_1.EventsOut.change, this.state);
    };
    TransactionManager.prototype.commitContent = function () {
        this.state.updateContent();
        this.app.emit(Event_1.EventsOut.contentchanged, this.state.content);
    };
    TransactionManager.prototype.commitNodeStates = function () {
        this.state.updateNodeState();
        this.app.emit(Event_1.EventsOut.nodestatechanged, this.state);
    };
    TransactionManager.prototype.commitSelection = function () {
        this.sm.commitSelection();
        this.app.emit(Event_1.EventsOut.selectionchanged, this.state.selection);
    };
    TransactionManager.prototype.updateDecorations = function () {
        // console.log('######', this.state.decorations.size);
        // if (!this.state.decorations.length && !this.s)
        // this.state.decorations.forEach(d => this.store.get(d.targetId)?.markForDecoration())
        // this.state.decorations.clear();
        // if (this.selection.isInvalid) return
        // this.pm.decoration(this);
        // this.state.decorations.forEach(d => {
        // 	console.log('decorating', d.targetId, this.store.get(d.targetId)?.name);
        // 	this.store.get(d.targetId)?.markForDecoration()
        // });
        // this.commitContent()
    };
    return TransactionManager;
}());
exports.TransactionManager = TransactionManager;
