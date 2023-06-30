"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
exports.__esModule = true;
exports.Decoration = exports.SpanComparator = exports.Span = void 0;
var lodash_1 = require("lodash");
var Point_1 = require("./Point");
// represents span with start and end points
var Span = /** @class */ (function () {
    function Span(start, end) {
        this.start = start;
        this.end = end;
    }
    Span.around = function (nodeId) {
        var start = Point_1.Point.toBefore(nodeId);
        var end = Point_1.Point.toAfter(nodeId);
        return new Span(start, end);
    };
    Span.create = function (nodeId, startOffset, endOffset) {
        var start = Point_1.Point.toWithin(nodeId, startOffset);
        var end = Point_1.Point.toWithin(nodeId, endOffset);
        return new Span(start, end);
    };
    Span.prototype.comp = function (b) {
        var start = this.start.nodeId.comp(b.start.nodeId);
        return start ? start : this.end.nodeId.comp(b.end.nodeId);
    };
    return Span;
}());
exports.Span = Span;
function SpanComparator(a, b) {
    return a.comp(b);
}
exports.SpanComparator = SpanComparator;
var Decoration = /** @class */ (function () {
    function Decoration(span, attrs, marks) {
        if (attrs === void 0) { attrs = {}; }
        if (marks === void 0) { marks = []; }
        this.span = span;
        this.attrs = attrs;
    }
    // marks: Mark[]
    Decoration.around = function (nodeId) {
        // console.log(node.id.withLen(0).toString(), node.id.toString());
        return new Decoration(Span.around(nodeId));
    };
    Object.defineProperty(Decoration.prototype, "targetId", {
        get: function () {
            return this.span.start.nodeId;
        },
        enumerable: false,
        configurable: true
    });
    // returns a merged decoration
    Decoration.prototype.merge = function (other) {
        var _this = this;
        var attrNames = __spreadArrays(lodash_1.keys(this.attrs), lodash_1.keys(other.attrs));
        var attrs = attrNames.reduce(function (o, attr) {
            var _a;
            var _b, _c;
            return __assign(__assign({}, o), (_a = {}, _a[attr] = lodash_1.uniq(__spreadArrays(((_b = _this.attrs[attr]) !== null && _b !== void 0 ? _b : '').split(' '), ((_c = other.attrs[attr]) !== null && _c !== void 0 ? _c : '').split(' '))).join(' ').trim(), _a));
        }, {});
        return new Decoration(this.span, attrs);
    };
    Decoration.prototype.addClass = function (className) {
        var _a;
        var classes = ((_a = this.attrs.className) !== null && _a !== void 0 ? _a : '').split(' ');
        this.attrs.className = __spreadArrays(classes, [className]).join(' ').trim();
        return this;
    };
    Decoration.prototype.add = function () { };
    Decoration.prototype.remove = function () { };
    return Decoration;
}());
exports.Decoration = Decoration;
