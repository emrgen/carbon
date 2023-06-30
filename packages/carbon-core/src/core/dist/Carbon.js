"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;
exports.Carbon = void 0;
var events_1 = require("events");
var domElement_1 = require("../utils/domElement");
var CarbonState_1 = require("./CarbonState");
var ChangeManager_1 = require("./ChangeManager");
var Event_1 = require("./Event");
var EventManager_1 = require("./EventManager");
var NodeStore_1 = require("./NodeStore");
var PinnedSelection_1 = require("./PinnedSelection");
var SelectionManager_1 = require("./SelectionManager");
var Transaction_1 = require("./Transaction");
var TransactionManager_1 = require("./TransactionManager");
var Carbon = /** @class */ (function (_super) {
    __extends(Carbon, _super);
    function Carbon(content, schema, pm, renderer) {
        var _this = _super.call(this) || this;
        _this.pm = pm;
        _this.rm = renderer;
        _this.schema = schema;
        _this.state = CarbonState_1.CarbonState.create(new NodeStore_1.NodeStore(), content, PinnedSelection_1.PinnedSelection["default"](content));
        _this.sm = new SelectionManager_1.SelectionManager(_this);
        _this.em = new EventManager_1.EventManager(_this, pm);
        _this.tm = new TransactionManager_1.TransactionManager(_this, pm, _this.sm);
        _this.change = new ChangeManager_1.ChangeManager(_this.state, _this.sm, _this.tm);
        _this.cmd = pm.commands(_this);
        _this.enabled = true;
        return _this;
    }
    Object.defineProperty(Carbon.prototype, "content", {
        get: function () {
            return this.state.content;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Carbon.prototype, "selection", {
        get: function () {
            return this.state.selection;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Carbon.prototype, "nodeSelection", {
        get: function () {
            return this.state.nodeSelection;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Carbon.prototype, "store", {
        get: function () {
            return this.state.store;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Carbon.prototype, "runtime", {
        get: function () {
            return this.state.runtime;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Carbon.prototype, "focused", {
        get: function () {
            return this.sm.focused;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Carbon.prototype, "tr", {
        get: function () {
            return Transaction_1.Transaction.create(this, this.tm, this.pm, this.sm);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Carbon.prototype, "element", {
        get: function () {
            var _a;
            this._element = (_a = this._element) !== null && _a !== void 0 ? _a : this.store.element(this.content.id);
            return this._element;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Carbon.prototype, "portal", {
        get: function () {
            var _a, _b;
            this._portal = (_b = (_a = this._portal) !== null && _a !== void 0 ? _a : domElement_1.querySelector('.editor > .portal')) !== null && _b !== void 0 ? _b : null;
            return this._portal;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Carbon.prototype, "contentElement", {
        get: function () {
            var _a, _b, _c;
            this._contentElement = (_c = (_a = this._contentElement) !== null && _a !== void 0 ? _a : (_b = document.getElementsByClassName('.editor > .editor-content')) === null || _b === void 0 ? void 0 : _b[0]) !== null && _c !== void 0 ? _c : null;
            return this._contentElement;
        },
        enumerable: false,
        configurable: true
    });
    // all events are emitted through this method
    Carbon.prototype.onEvent = function (type, event) {
        if (type === Event_1.EventsIn.custom) {
            this.em.onCustomEvent(event);
        }
        else {
            this.em.onEvent(type, event);
        }
    };
    Carbon.prototype.component = function (name) {
        return this.rm.component(name);
    };
    Carbon.prototype.serialize = function (node) {
        return this.pm.serialize(this, node);
    };
    Carbon.prototype.deserialize = function (serialized) {
        return this.pm.deserialize(this, serialized);
    };
    Carbon.prototype.blur = function () {
        this.sm.blur();
    };
    Carbon.prototype.focus = function () {
        this.sm.focus();
    };
    Carbon.prototype.enable = function () {
        this.enabled = true;
    };
    Carbon.prototype.disable = function () {
        this.enabled = false;
    };
    return Carbon;
}(events_1.EventEmitter));
exports.Carbon = Carbon;
