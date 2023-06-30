"use strict";
exports.__esModule = true;
exports.SelectNodes = void 0;
var Logger_1 = require("../Logger");
var Result_1 = require("./Result");
var types_1 = require("./types");
var utils_1 = require("./utils");
var BSet_1 = require("../BSet");
var SelectNodes = /** @class */ (function () {
    function SelectNodes(nodeIds, origin) {
        this.type = types_1.ActionType.selectNodes;
        this.id = utils_1.generateActionId();
        this.origin = origin;
        var ids = new BSet_1.NodeIdSet();
        nodeIds.forEach(function (id) { return ids.add(id); });
        this.nodeIds = ids.toArray();
    }
    SelectNodes.fromJSON = function (json) { };
    SelectNodes.create = function (nodeIds, origin) {
        return new SelectNodes(nodeIds, origin);
    };
    SelectNodes.prototype.execute = function (tr) {
        var app = tr.app;
        var store = app.store, state = app.state;
        var selectedNodeIds = state.selectedNodeIds;
        var beforeSelectedNodes = selectedNodeIds.map(function (id) { return store.get(id); });
        var afterSelectedNodes = this.nodeIds.map(function (id) { return store.get(id); });
        beforeSelectedNodes.filter(function (n) { return n.isSelected; }).forEach(function (n) {
            n.updateData({ state: { selected: false } });
        });
        afterSelectedNodes.forEach(function (n) {
            n.updateData({ state: { selected: true } });
        });
        console.log(afterSelectedNodes.map(function (n) { return n.id.toString(); }));
        tr.selected.apply(tr, beforeSelectedNodes);
        tr.selected.apply(tr, afterSelectedNodes);
        return Result_1.NULL_ACTION_RESULT;
    };
    SelectNodes.prototype.inverse = function () {
        throw new Error("Method not implemented.");
    };
    SelectNodes.prototype.toString = function () {
        return Logger_1.classString(this)([this.nodeIds.map(function (id) { return id.toString(); })]);
    };
    SelectNodes.prototype.toJSON = function () {
        throw new Error("Method not implemented.");
    };
    return SelectNodes;
}());
exports.SelectNodes = SelectNodes;
