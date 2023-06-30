"use strict";
exports.__esModule = true;
exports.CarbonClipboard = void 0;
var Fragment_1 = require("./Fragment");
var CarbonClipboard = /** @class */ (function () {
    function CarbonClipboard() {
        this.fragment = Fragment_1.Fragment.from([]);
    }
    CarbonClipboard["default"] = function () {
        return new CarbonClipboard();
    };
    Object.defineProperty(CarbonClipboard.prototype, "isEmpty", {
        get: function () {
            return this.fragment.isEmpty;
        },
        enumerable: false,
        configurable: true
    });
    CarbonClipboard.prototype.setFragment = function (fragment) {
        this.fragment = fragment;
    };
    CarbonClipboard.prototype.clear = function () {
        this.fragment = Fragment_1.Fragment.from([]);
    };
    return CarbonClipboard;
}());
exports.CarbonClipboard = CarbonClipboard;
