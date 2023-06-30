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
exports.ChangeManager = exports.NodeChangeType = void 0;
var lodash_1 = require("lodash");
var BSet_1 = require("./BSet");
var NodeEmitter_1 = require("./NodeEmitter");
var NodeChangeType;
(function (NodeChangeType) {
    NodeChangeType["update"] = "update";
    NodeChangeType["state"] = "state";
})(NodeChangeType = exports.NodeChangeType || (exports.NodeChangeType = {}));
/**
 * Syncs the editor state with the UI
 */
var ChangeManager = /** @class */ (function (_super) {
    __extends(ChangeManager, _super);
    function ChangeManager(state, sm, tm) {
        var _this = _super.call(this) || this;
        _this.state = state;
        _this.sm = sm;
        _this.tm = tm;
        return _this;
    }
    Object.defineProperty(ChangeManager.prototype, "store", {
        get: function () {
            return this.state.store;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ChangeManager.prototype, "isContentSynced", {
        get: function () {
            return !this.state.runtime.updatedNodeIds.size;
        },
        enumerable: false,
        configurable: true
    });
    // 1. sync the doc
    // 2. sync the selection
    // 3. sync the node state
    ChangeManager.prototype.update = function () {
        if (this.state.isContentDirty) {
            this.updateContent();
            console.log('update content');
            return;
        }
        if (this.state.isNodeStateDirty) {
            // console.log('update node states');
            this.updateNodeState();
            return;
        }
        if (this.state.isSelectionDirty) {
            this.updateSelection();
            // console.log('update selection');
            return;
        }
    };
    ChangeManager.prototype.mounted = function (node) {
        this.state.runtime.updatedNodeIds.remove(node.id);
        if (this.isContentSynced && this.state.isSelectionDirty) {
            this.updateSelection();
        }
    };
    ChangeManager.prototype.updateContent = function () {
        var _this = this;
        console.group('syncing:  content');
        // console.group('syncing: content')
        var updatedNodeIds = this.state.runtime.updatedNodeIds;
        var updatedNodes = updatedNodeIds.map(function (n) { return _this.store.get(n); }).filter(lodash_1.identity);
        // find remove nodes if ancestor is present in the updateNodes
        updatedNodes.forEach(function (n) {
            updatedNodeIds.remove(n.id);
            if (n.closest(function (p) { return updatedNodeIds.has(p.id); })) {
                _this.state.runtime.updatedNodeIds.remove(n.id);
                return;
            }
            updatedNodeIds.add(n.id);
        });
        // console.log(updatedNodes);
        lodash_1.each(updatedNodes, function (n) { return _this.publish(NodeChangeType.update, n); });
        console.groupEnd();
    };
    // 
    ChangeManager.prototype.updateNodeState = function () {
        var _this = this;
        var _a = this.state, selectedNodeIds = _a.selectedNodeIds, unselectedNodeIds = _a.unselectedNodeIds, activatedNodeIds = _a.activatedNodeIds, deactivatedNodeIds = _a.deactivatedNodeIds;
        var dirtyNodesIds = new BSet_1.NodeIdSet();
        dirtyNodesIds.extend(selectedNodeIds, unselectedNodeIds, activatedNodeIds, deactivatedNodeIds);
        var dirtyNodes = dirtyNodesIds.map(function (n) { return _this.store.get(n); }).filter(lodash_1.identity);
        this.state.runtime.selectedNodeIds.clear();
        this.state.runtime.activatedNodeIds.clear();
        console.log(dirtyNodes.map(function (n) { return n.data; }));
        lodash_1.each(dirtyNodes, function (n) { return _this.publish(NodeChangeType.state, n); });
    };
    ChangeManager.prototype.updateSelection = function () {
        if (!this.isContentSynced) {
            throw new Error("Trying to sync selection with dirty content");
            return;
        }
        // if (this.state.runtime.selectedNodeIds.size) {
        // 	this.updateNodeState()
        // }
        console.group('syncing: selection');
        this.sm.syncSelection();
        this.tm.dispatch();
        console.groupEnd();
    };
    return ChangeManager;
}(NodeEmitter_1.NodeTopicEmitter));
exports.ChangeManager = ChangeManager;
