"use strict";
exports.__esModule = true;
exports.SelectionEvent = void 0;
var SelectionEvent = /** @class */ (function () {
    function SelectionEvent(before, after, origin) {
        this.after = after;
        this.before = before;
        this.origin = origin;
    }
    SelectionEvent.create = function (before, after, origin) {
        return new SelectionEvent(before, after, origin);
    };
    return SelectionEvent;
}());
exports.SelectionEvent = SelectionEvent;
