"use strict";
exports.__esModule = true;
exports.SelectionPatch = void 0;
var BSet_1 = require("./BSet");
var SelectionPatch = /** @class */ (function () {
    function SelectionPatch() {
        this.ids = new BSet_1.NodeIdSet();
        this.ranges = [];
    }
    SelectionPatch.fromState = function (state) {
        var patch = new SelectionPatch();
        return patch;
    };
    SelectionPatch["default"] = function () {
        return new SelectionPatch();
    };
    SelectionPatch.prototype.addRange = function (range) {
        this.ranges.push(range);
    };
    SelectionPatch.prototype.removeRange = function (range) {
        this.ranges = this.ranges.filter(function (r) { return r !== range; });
    };
    SelectionPatch.prototype.addId = function (id) {
        this.ids.add(id);
    };
    SelectionPatch.prototype.has = function (id) {
        return this.ids.has(id);
    };
    return SelectionPatch;
}());
exports.SelectionPatch = SelectionPatch;
