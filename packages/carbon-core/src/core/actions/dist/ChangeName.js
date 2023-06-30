"use strict";
exports.__esModule = true;
exports.ChangeName = void 0;
var Logger_1 = require("../Logger");
var Result_1 = require("./Result");
var types_1 = require("./types");
var utils_1 = require("./utils");
var ChangeName = /** @class */ (function () {
    function ChangeName(nodeId, from, to, origin) {
        this.nodeId = nodeId;
        this.from = from;
        this.to = to;
        this.origin = origin;
        this.id = utils_1.generateActionId();
    }
    ChangeName.create = function (nodeId, from, to, origin) {
        if (origin === void 0) { origin = types_1.ActionOrigin.UserInput; }
        return new ChangeName(nodeId, from, to, origin);
    };
    ChangeName.prototype.execute = function (tr) {
        var _a = this, nodeId = _a.nodeId, to = _a.to;
        var app = tr.app;
        var target = app.store.get(nodeId);
        if (!target) {
            return Result_1.ActionResult.withError('failed to find target from: ' + nodeId.toString());
        }
        var type = tr.app.schema.type(to);
        target.changeType(type);
        tr.updated(target);
        return Result_1.ActionResult.withValue('done');
    };
    ChangeName.prototype.inverse = function () {
        throw new Error("Not implemented");
    };
    ChangeName.prototype.toString = function () {
        // const { at, text, origin } = this
        return Logger_1.classString(this)({
        // 	at: at.toString(),
        // 	text,
        // 	origin,
        });
    };
    return ChangeName;
}());
exports.ChangeName = ChangeName;
