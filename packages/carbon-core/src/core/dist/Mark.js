"use strict";
exports.__esModule = true;
exports.MarkSet = exports.Mark = void 0;
var lodash_1 = require("lodash");
var Mark = /** @class */ (function () {
    function Mark(type, color) {
        this.type = type;
        this.color = color;
    }
    Mark.bold = function () {
        return new Mark('bold');
    };
    Mark.italic = function () {
        return new Mark('italic');
    };
    Mark.underline = function () {
        return new Mark('underline');
    };
    Mark.strike = function () {
        return new Mark('strike');
    };
    Mark.color = function (color) {
        return new Mark('color');
    };
    Mark.background = function (color) {
        return new Mark('bg');
    };
    Mark.prototype.toString = function () {
        return JSON.stringify(this.toJSON());
    };
    Mark.prototype.toJSON = function () {
        var _a = this, type = _a.type, color = _a.color;
        var ret = { type: type };
        if (this.color) {
            ret.color = color;
        }
        return ret;
    };
    return Mark;
}());
exports.Mark = Mark;
var MarkSet = /** @class */ (function () {
    function MarkSet(marks) {
        var _this = this;
        if (marks === void 0) { marks = []; }
        this.marks = {};
        lodash_1.each(marks, function (m) { return _this.add(m); });
    }
    Object.defineProperty(MarkSet.prototype, "size", {
        get: function () {
            return lodash_1.keys(this.marks).length;
        },
        enumerable: false,
        configurable: true
    });
    MarkSet.empty = function () {
        return new MarkSet([]);
    };
    MarkSet.prototype.add = function (mark) {
        var _this = this;
        if (lodash_1.isArray(mark)) {
            lodash_1.each(mark, function (m) { return _this.add(m); });
        }
        else {
            this.marks[mark.type] = mark;
        }
    };
    MarkSet.prototype.remove = function (mark) {
        delete this.marks[mark.type];
    };
    MarkSet.prototype.map = function (fn) {
        return lodash_1.values(this.marks).map(fn);
    };
    MarkSet.prototype.forEach = function (fn) {
        lodash_1.values(this.marks).forEach(fn);
    };
    MarkSet.prototype.toJSON = function () {
        return lodash_1.keys(this.marks);
    };
    return MarkSet;
}());
exports.MarkSet = MarkSet;
