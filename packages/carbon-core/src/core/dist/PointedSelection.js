"use strict";
exports.__esModule = true;
exports.PointedSelection = void 0;
var Point_1 = require("./Point");
var PinnedSelection_1 = require("./PinnedSelection");
var Pin_1 = require("./Pin");
var Logger_1 = require("./Logger");
var PointedSelection = /** @class */ (function () {
    function PointedSelection(tail, head) {
        this.tail = tail;
        this.head = head;
    }
    Object.defineProperty(PointedSelection.prototype, "isInvalid", {
        get: function () {
            return this.head.isDefault || this.tail.isDefault;
        },
        enumerable: false,
        configurable: true
    });
    PointedSelection.within = function (nodeId, offset) {
        if (offset === void 0) { offset = 0; }
        return PointedSelection.fromPoint(Point_1.Point.toWithin(nodeId, offset));
    };
    PointedSelection.fromPoint = function (point) {
        return PointedSelection.create(point, point);
    };
    PointedSelection.create = function (tail, head) {
        return new PointedSelection(tail, head);
    };
    PointedSelection.prototype.pin = function (store) {
        var _a = this, tail = _a.tail, head = _a.head;
        // console.log('Selection.pin', head.toString());
        var focus = Pin_1.Pin.fromPoint(head, store);
        var anchor = Pin_1.Pin.fromPoint(tail, store);
        if (!focus || !anchor) {
            console.warn('Selection.pin: invalid selection', this.toString(), head.toString(), store.get(head.nodeId));
            return;
        }
        return PinnedSelection_1.PinnedSelection.create(anchor, focus);
    };
    PointedSelection.prototype.eq = function (other) {
        return this.tail.eq(other.tail) && this.head.eq(other.head);
    };
    PointedSelection.prototype.unpin = function () {
        return this;
    };
    PointedSelection.prototype.clone = function () {
        return PointedSelection.create(this.tail.clone(), this.head.clone());
    };
    PointedSelection.prototype.toString = function () {
        return Logger_1.classString(this)({
            tail: this.tail.toString(),
            head: this.head.toString()
        });
    };
    PointedSelection.prototype.toJSON = function () {
        var _a = this, tail = _a.tail, head = _a.head;
        return { tail: tail.toString(), head: head.toString() };
    };
    return PointedSelection;
}());
exports.PointedSelection = PointedSelection;
