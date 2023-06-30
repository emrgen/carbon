"use strict";
exports.__esModule = true;
exports.MoveAction = void 0;
var Result_1 = require("./Result");
var types_1 = require("./types");
var utils_1 = require("./utils");
var Fragment_1 = require("../Fragment");
var Logger_1 = require("../Logger");
var MoveAction = /** @class */ (function () {
    function MoveAction(from, to, nodeId, origin) {
        this.from = from;
        this.to = to;
        this.nodeId = nodeId;
        this.id = utils_1.generateActionId();
        this.origin = origin;
    }
    MoveAction.create = function (from, to, nodeId, origin) {
        if (origin === void 0) { origin = types_1.ActionOrigin.UserInput; }
        return new MoveAction(from, to, nodeId, origin);
    };
    MoveAction.prototype.execute = function (tr) {
        var _a;
        var app = tr.app;
        var _b = this, to = _b.to, nodeId = _b.nodeId;
        var target = app.store.get(to.nodeId);
        if (!target) {
            return Result_1.ActionResult.withError('Failed to get target node');
        }
        var parent = target.parent;
        if (!parent) {
            return Result_1.ActionResult.withError('Failed to get target parent node');
        }
        var moveNode = app.store.get(nodeId);
        if (!moveNode) {
            return Result_1.ActionResult.withError('failed to find node from id: ' + nodeId.toString());
        }
        tr.updated(moveNode.parent);
        tr.normalize(moveNode.parent);
        console.log('xxxxxxx');
        (_a = moveNode.parent) === null || _a === void 0 ? void 0 : _a.remove(moveNode);
        moveNode.forAll(function (n) { return app.store["delete"](n); });
        var fragment = Fragment_1.Fragment.fromNode(moveNode);
        console.log("MOVE: move node", moveNode, "to", to.toString(), target);
        if (to.isBefore) {
            console.log('vvvvvvvvvvvvvv');
            target.append(fragment);
            fragment.forAll(function (n) { return app.store.put(n); });
            parent.insertBefore(fragment, target);
            tr.updated(parent);
            return Result_1.NULL_ACTION_RESULT;
        }
        if (to.isAfter) {
            // if (target.nextSibling?.eq(fragment.child(0))) {
            // 	return NULL_ACTION_RESULT
            // }
            fragment.forAll(function (n) { return console.log(n.id.toString()); });
            // console.log('move after', to.toString(),)
            parent.insertAfter(fragment, target);
            fragment.forAll(function (n) {
                app.store.put(n);
            });
            tr.updated(parent);
            return Result_1.NULL_ACTION_RESULT;
        }
        if (to.isWithin) {
            target.append(fragment);
            fragment.forAll(function (n) { return app.store.put(n); });
            tr.updated(target);
            return Result_1.NULL_ACTION_RESULT;
        }
        return Result_1.ActionResult.withError('Failed to move node');
    };
    MoveAction.prototype.inverse = function () {
        throw new Error("Method not implemented.");
    };
    MoveAction.prototype.toString = function () {
        return Logger_1.classString(this)({ from: this.from.toString(), to: this.to.toString(), nodeId: this.nodeId.toString() });
    };
    return MoveAction;
}());
exports.MoveAction = MoveAction;
