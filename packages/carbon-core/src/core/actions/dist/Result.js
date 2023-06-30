"use strict";
exports.__esModule = true;
exports.NULL_ACTION_RESULT = exports.ActionResult = void 0;
var Error_1 = require("./Error");
// acts as a wrapper for the result of an action
var ActionResult = /** @class */ (function () {
    function ActionResult(result, error) {
        if (result === void 0) { result = null; }
        if (error === void 0) { error = { message: '' }; }
        this.value = result;
        this.error = error;
    }
    ActionResult.withValue = function (value) {
        return new ActionResult(value);
    };
    ActionResult.withError = function (message, value) {
        return new ActionResult(null, Error_1.CommandError.from(message, value));
    };
    ActionResult.withErrorMessage = function (message) {
        return new ActionResult(null, Error_1.CommandError.from(message));
    };
    Object.defineProperty(ActionResult.prototype, "ok", {
        get: function () {
            var _a;
            return ((_a = this.error) === null || _a === void 0 ? void 0 : _a.message) === '';
        },
        enumerable: false,
        configurable: true
    });
    // should check with `ok` before calling this method
    ActionResult.prototype.unwrap = function () {
        if (!this.ok) {
            throw new Error("value is empty");
        }
        return this.value;
    };
    return ActionResult;
}());
exports.ActionResult = ActionResult;
// this is a special ActionResult that is used to indicate that an action has no effect
exports.NULL_ACTION_RESULT = ActionResult.withValue('done');
