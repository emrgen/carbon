"use strict";
exports.__esModule = true;
exports.InsertNodes = void 0;
var types_1 = require("./types");
var utils_1 = require("./utils");
var Result_1 = require("./Result");
var Logger_1 = require("../Logger");
var InsertNodes = /** @class */ (function () {
    function InsertNodes(at, fragment, origin) {
        this.at = at;
        this.fragment = fragment;
        this.origin = origin;
        this.id = utils_1.generateActionId();
    }
    InsertNodes.create = function (at, fragment, origin) {
        if (origin === void 0) { origin = types_1.ActionOrigin.UserInput; }
        return new InsertNodes(at, fragment, origin);
    };
    InsertNodes.prototype.execute = function (tr) {
        var _a = this, at = _a.at, fragment = _a.fragment;
        var app = tr.app;
        var target = app.store.get(at.nodeId);
        // const pin = Pin.fromPoint(at, tr.app.store);
        if (!target) {
            return Result_1.ActionResult.withError('failed to find target from: ' + at.toString());
        }
        var parent = target.parent;
        if (!parent) {
            return Result_1.ActionResult.withError('failed to find target parent from: ' + at.toString());
        }
        var done = function () {
            fragment.forAll(function (n) { return app.store.put(n); });
            tr.updated(parent);
            return Result_1.ActionResult.withValue('done');
        };
        if (at.isBefore) {
            // console.log('inserting text before', fragment);
            parent.insertBefore(fragment, target);
            return done();
        }
        if (at.isAfter) {
            parent.insertAfter(fragment, target);
            return done();
        }
        if (at.isWithin) {
            console.log(target, fragment);
            target.append(fragment);
            return done();
        }
        return Result_1.ActionResult.withError('failed to insert fragment');
    };
    InsertNodes.prototype.inverse = function () {
        throw new Error("Not implemented");
    };
    InsertNodes.prototype.toString = function () {
        // const { at, text, origin } = this
        return Logger_1.classString(this)({
        // 	at: at.toString(),
        // 	text,
        // 	origin,
        });
    };
    return InsertNodes;
}());
exports.InsertNodes = InsertNodes;
