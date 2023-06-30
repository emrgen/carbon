"use strict";
exports.__esModule = true;
exports.CarbonState = exports.CarbonRuntimeState = void 0;
var lodash_1 = require("lodash");
var BSet_1 = require("./BSet");
var types_1 = require("./actions/types");
var DecorationStore_1 = require("./DecorationStore");
var NodeSelection_1 = require("./NodeSelection");
var CarbonClipboard_1 = require("./CarbonClipboard");
var CarbonRuntimeState = /** @class */ (function () {
    function CarbonRuntimeState() {
        // pending
        this.selectEvents = [];
        // content updated node ids
        this.updatedNodeIds = new BSet_1.NodeIdSet();
        // selected node ids
        this.selectedNodeIds = new BSet_1.NodeIdSet();
        // activated node ids
        this.activatedNodeIds = new BSet_1.NodeIdSet();
        // deleted node ids
        this.deletedNodeIds = new BSet_1.NodeIdSet();
        // activeMarks: string = '';
        this.origin = types_1.ActionOrigin.Unknown;
        this.clipboard = CarbonClipboard_1.CarbonClipboard["default"]();
    }
    Object.defineProperty(CarbonRuntimeState.prototype, "isDirty", {
        get: function () {
            return this.updatedNodeIds.size;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(CarbonRuntimeState.prototype, "selectEvent", {
        get: function () {
            return lodash_1.last(this.selectEvents);
        },
        enumerable: false,
        configurable: true
    });
    CarbonRuntimeState.prototype.addSelectEvent = function (event) {
        this.selectEvents.push(event);
    };
    return CarbonRuntimeState;
}());
exports.CarbonRuntimeState = CarbonRuntimeState;
var CarbonState = /** @class */ (function () {
    function CarbonState(props) {
        this.selectionOrigin = types_1.ActionOrigin.Unknown;
        this.dirty = false;
        var store = props.store, content = props.content, selection = props.selection, _a = props.runtime, runtime = _a === void 0 ? new CarbonRuntimeState() : _a, _b = props.decorations, decorations = _b === void 0 ? new DecorationStore_1.DecorationStore() : _b, _c = props.selectedNodeIds, selectedNodeIds = _c === void 0 ? new BSet_1.NodeIdSet() : _c, _d = props.activatedNodeIds, activatedNodeIds = _d === void 0 ? new BSet_1.NodeIdSet() : _d;
        this.content = content;
        this.selection = selection;
        this.decorations = decorations;
        this.runtime = runtime;
        this.store = store;
        this.selectedNodeIds = selectedNodeIds;
        this.activatedNodeIds = activatedNodeIds;
        this.deactivatedNodeIds = new BSet_1.NodeIdSet();
        this.unselectedNodeIds = new BSet_1.NodeIdSet();
        this.dirty = false;
        this.selectionSynced = false;
    }
    Object.defineProperty(CarbonState.prototype, "isDirty", {
        get: function () {
            return this.dirty || true;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(CarbonState.prototype, "isContentDirty", {
        get: function () {
            return this.runtime.isDirty || this.decorations.size;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(CarbonState.prototype, "isSelectionDirty", {
        get: function () {
            return !this.selectionSynced;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(CarbonState.prototype, "isNodeStateDirty", {
        get: function () {
            return this.runtime.selectedNodeIds.size || this.runtime.activatedNodeIds.size;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(CarbonState.prototype, "nodeSelection", {
        get: function () {
            return new NodeSelection_1.NodeSelection(this.store, this.selectedNodeIds);
        },
        enumerable: false,
        configurable: true
    });
    CarbonState.create = function (store, content, selection) {
        return new CarbonState({ store: store, content: content, selection: selection });
    };
    CarbonState.prototype.init = function () {
        var _this = this;
        this.store.reset();
        this.content.forAll(function (n) {
            _this.store.put(n);
            _this.runtime.updatedNodeIds.add(n.id);
        });
    };
    CarbonState.prototype.markDirty = function () {
        this.dirty = true;
    };
    CarbonState.prototype.markClean = function () {
        this.dirty = false;
    };
    CarbonState.prototype.setContent = function (content) {
        this.content = content;
        this.init();
    };
    CarbonState.prototype.updateSelection = function (after, origin, selectionSynced) {
        if (selectionSynced === void 0) { selectionSynced = false; }
        this.prevSelection = this.selection;
        this.selection = after;
        this.selectionOrigin = origin;
        this.selectionSynced = selectionSynced;
    };
    CarbonState.prototype.updateNodeState = function () {
        var _this = this;
        if (!this.runtime.activatedNodeIds.size && !this.runtime.selectedNodeIds.size)
            return;
        var store = this.store;
        this.selectedNodeIds.clear();
        this.unselectedNodeIds.clear();
        this.deactivatedNodeIds.clear();
        this.activatedNodeIds.clear();
        this.runtime.selectedNodeIds.forEach(function (id) {
            var _a;
            if ((_a = store.get(id)) === null || _a === void 0 ? void 0 : _a.isSelected) {
                _this.selectedNodeIds.add(id);
            }
            else {
                _this.unselectedNodeIds.add(id);
            }
        });
        this.runtime.activatedNodeIds.forEach(function (id) {
            var _a;
            if ((_a = store.get(id)) === null || _a === void 0 ? void 0 : _a.isActive) {
                _this.activatedNodeIds.add(id);
            }
            else {
                _this.deactivatedNodeIds.add(id);
            }
        });
    };
    CarbonState.prototype.updateContent = function () {
        var _this = this;
        if (!this.content.isDirty)
            return;
        var nodes = [];
        this.content = this.content.view(nodes);
        // console.log('document id', this.content.childrenVersion)
        nodes.forEach(function (n) {
            // console.log('new node', n.id.toString(), n.childrenVersion)
            _this.store.put(n);
        });
    };
    CarbonState.prototype.clone = function () {
        return CarbonState.create(this.store, this.content, this.selection);
    };
    return CarbonState;
}());
exports.CarbonState = CarbonState;
