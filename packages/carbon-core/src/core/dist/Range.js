"use strict";
exports.__esModule = true;
exports.Range = void 0;
var Logger_1 = require("./Logger");
// ready to be applied to dom
// should be directly mappable to dom nodes
var Range = /** @class */ (function () {
    function Range(props) {
        var start = props.start, end = props.end;
        this.start = start;
        this.end = end;
    }
    Range.create = function (start, end) {
        return new Range({ start: start, end: end });
    };
    Range.prototype.toString = function () {
        return Logger_1.withCons(this)(JSON.stringify(this.toJSON()));
    };
    Range.prototype.toJSON = function () {
        return {
            tail: this.start.toJSON(),
            head: this.end.toJSON()
        };
    };
    return Range;
}());
exports.Range = Range;
