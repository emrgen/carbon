"use strict";
exports.__esModule = true;
exports.UpdateAttrs = void 0;
var Logger_1 = require("../Logger");
var Result_1 = require("./Result");
var types_1 = require("./types");
var utils_1 = require("./utils");
var UpdateAttrs = /** @class */ (function () {
    function UpdateAttrs(nodeId, attrs, origin) {
        this.nodeId = nodeId;
        this.attrs = attrs;
        this.origin = origin;
        this.type = types_1.ActionType.updateAttrs;
        this.id = utils_1.generateActionId();
    }
    UpdateAttrs.fromJSON = function (json) { };
    UpdateAttrs.create = function (nodeId, attrs, origin) {
        return new UpdateAttrs(nodeId, attrs, origin);
    };
    UpdateAttrs.prototype.execute = function (tr) {
        var app = tr.app;
        var store = app.store, state = app.state;
        var nodeId = this.nodeId;
        var node = store.get(nodeId);
        if (!node) {
            console.warn('node not found', nodeId);
            return Result_1.NULL_ACTION_RESULT;
        }
        node.updateAttrs(this.attrs);
        tr.updated(node);
        return Result_1.NULL_ACTION_RESULT;
    };
    UpdateAttrs.prototype.inverse = function () {
        throw new Error("Method not implemented.");
    };
    UpdateAttrs.prototype.toString = function () {
        return Logger_1.classString(this)(this.nodeId.toString());
    };
    UpdateAttrs.prototype.toJSON = function () {
        throw new Error("Method not implemented.");
    };
    return UpdateAttrs;
}());
exports.UpdateAttrs = UpdateAttrs;
