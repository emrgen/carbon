"use strict";
exports.__esModule = true;
exports.ActivateNodes = void 0;
var Logger_1 = require("../Logger");
var Result_1 = require("./Result");
var types_1 = require("./types");
var utils_1 = require("./utils");
var BSet_1 = require("../BSet");
var ActivateNodes = /** @class */ (function () {
    function ActivateNodes(nodeIds, origin) {
        this.type = types_1.ActionType.selectNodes;
        this.id = utils_1.generateActionId();
        this.origin = origin;
        var ids = new BSet_1.NodeIdSet();
        nodeIds.forEach(function (id) { return ids.add(id); });
        this.nodeIds = ids.toArray();
    }
    ActivateNodes.fromJSON = function (json) { };
    ActivateNodes.create = function (nodeIds, origin) {
        return new ActivateNodes(nodeIds, origin);
    };
    ActivateNodes.prototype.execute = function (tr) {
        var app = tr.app;
        var store = app.store, state = app.state;
        var selectedNodeIds = state.selectedNodeIds;
        var beforeActivatedNodes = selectedNodeIds.map(function (id) { return store.get(id); });
        var afterActivatedNodes = this.nodeIds.map(function (id) { return store.get(id); });
        beforeActivatedNodes.filter(function (n) { return n.isActive; }).forEach(function (n) {
            n.updateData({ state: { active: false } });
        });
        afterActivatedNodes.forEach(function (n) {
            n.updateData({ state: { active: true } });
        });
        console.log(afterActivatedNodes.map(function (n) { return n.id.toString(); }));
        tr.selected.apply(tr, beforeActivatedNodes);
        tr.selected.apply(tr, afterActivatedNodes);
        return Result_1.NULL_ACTION_RESULT;
    };
    ActivateNodes.prototype.inverse = function () {
        throw new Error("Method not implemented.");
    };
    ActivateNodes.prototype.toString = function () {
        return Logger_1.classString(this)([this.nodeIds.map(function (id) { return id.toString(); })]);
    };
    ActivateNodes.prototype.toJSON = function () {
        throw new Error("Method not implemented.");
    };
    return ActivateNodes;
}());
exports.ActivateNodes = ActivateNodes;
