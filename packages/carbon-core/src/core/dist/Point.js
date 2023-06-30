"use strict";
exports.__esModule = true;
exports.Point = void 0;
var Logger_1 = require("./Logger");
var PointAt;
(function (PointAt) {
    PointAt[PointAt["Before"] = 0] = "Before";
    PointAt[PointAt["Within"] = 1] = "Within";
    PointAt[PointAt["After"] = 2] = "After";
})(PointAt || (PointAt = {}));
// point is a relative offset position within a node
var Point = /** @class */ (function () {
    function Point(nodeId, at, offset) {
        if (offset === void 0) { offset = -1; }
        this.nodeId = nodeId;
        this.at = at;
        this.offset = offset;
    }
    Object.defineProperty(Point.prototype, "isDefault", {
        get: function () {
            return this.nodeId.isDefault;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Point.prototype, "isWithin", {
        get: function () {
            return this.at === PointAt.Within;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Point.prototype, "isBefore", {
        get: function () {
            return this.at === PointAt.Before;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Point.prototype, "isAfter", {
        get: function () {
            return this.at === PointAt.After;
        },
        enumerable: false,
        configurable: true
    });
    Point.toBefore = function (nodeId) {
        return new Point(nodeId, 0);
    };
    // point to after the id
    Point.toAfter = function (nodeId) {
        return new Point(nodeId, 2);
    };
    Point.toWithin = function (nodeId, offset) {
        if (offset === void 0) { offset = 0; }
        return new Point(nodeId, 1, offset);
    };
    Point.create = function (nodeId, at, offset) {
        if (offset === void 0) { offset = 0; }
        return new Point(nodeId, at, offset);
    };
    Point.prototype.map = function (fn) {
        return fn(this);
    };
    Point.prototype.eq = function (other) {
        return this.nodeId.eq(other.nodeId) && this.at === other.at && this.offset === other.offset;
    };
    Point.prototype.clone = function () {
        return Point.create(this.nodeId.clone(), this.at, this.offset);
    };
    Point.prototype.toString = function () {
        var _a = this, nodeId = _a.nodeId, at = _a.at, offset = _a.offset;
        return Logger_1.classString(this)(nodeId.toString() + "/" + at + "/" + offset);
    };
    return Point;
}());
exports.Point = Point;
