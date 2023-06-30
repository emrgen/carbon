"use strict";
exports.__esModule = true;
exports.CommandError = void 0;
var CommandError = /** @class */ (function () {
    function CommandError(message, value) {
        this.message = message;
        this.value = value;
    }
    CommandError.from = function (message, value) {
        if (value === void 0) { value = null; }
        return new CommandError(message, value);
    };
    return CommandError;
}());
exports.CommandError = CommandError;
