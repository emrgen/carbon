"use strict";
exports.__esModule = true;
exports.RemoveNode = void 0;
var types_1 = require("./types");
var Result_1 = require("./Result");
var utils_1 = require("./utils");
// action to remove a node by id
var RemoveNode = /** @class */ (function () {
    function RemoveNode(at, nodeId, origin) {
        this.at = at;
        this.nodeId = nodeId;
        this.origin = origin;
        this.id = utils_1.generateActionId();
        this.type = types_1.ActionType.insertText;
    }
    RemoveNode.create = function (at, nodeId, origin) {
        if (origin === void 0) { origin = types_1.ActionOrigin.UserInput; }
        return new RemoveNode(at, nodeId, origin);
    };
    RemoveNode.prototype.execute = function (tr) {
        var _a;
        var _b = this, at = _b.at, nodeId = _b.nodeId;
        var app = tr.app;
        var target = app.store.get(nodeId);
        if (!target) {
            return Result_1.ActionResult.withError('');
        }
        (_a = target.parent) === null || _a === void 0 ? void 0 : _a.remove(target);
        tr.updated(target.parent);
        tr.normalize(target.parent);
        return Result_1.ActionResult.withValue('done');
    };
    RemoveNode.prototype.inverse = function () {
        throw new Error("Method not implemented.");
    };
    return RemoveNode;
}());
exports.RemoveNode = RemoveNode;
