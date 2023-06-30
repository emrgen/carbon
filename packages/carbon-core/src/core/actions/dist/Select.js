"use strict";
exports.__esModule = true;
exports.SelectAction = void 0;
var Result_1 = require("./Result");
var utils_1 = require("./utils");
var Logger_1 = require("../Logger");
var SelectAction = /** @class */ (function () {
    function SelectAction(before, after, origin) {
        this.id = utils_1.generateActionId();
        this.before = before;
        this.after = after;
        this.origin = origin;
    }
    SelectAction.create = function (before, after, origin) {
        return new SelectAction(before, after, origin);
    };
    SelectAction.prototype.execute = function (tr) {
        var _a = this, before = _a.before, after = _a.after, origin = _a.origin;
        tr.onSelect(before, after, origin);
        return Result_1.ActionResult.withValue('done');
    };
    SelectAction.prototype.inverse = function () {
        throw new Error("Method not implemented.");
    };
    SelectAction.prototype.toString = function () {
        var _a = this, after = _a.after, before = _a.before;
        return Logger_1.classString(this)([after, before]);
    };
    return SelectAction;
}());
exports.SelectAction = SelectAction;
