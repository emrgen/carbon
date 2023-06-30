"use strict";
exports.__esModule = true;
exports.PNode = exports.PNodeContent = exports.PPoint = exports.PPin = exports.PPath = void 0;
var PPath = /** @class */ (function () {
    function PPath(indices) {
        this.indices = indices;
    }
    return PPath;
}());
exports.PPath = PPath;
var PPin = /** @class */ (function () {
    function PPin(path, offset) {
        this.path = path;
        this.offset = offset;
    }
    return PPin;
}());
exports.PPin = PPin;
var PPointAt;
(function (PPointAt) {
    PPointAt[PPointAt["Before"] = 0] = "Before";
    PPointAt[PPointAt["Within"] = 1] = "Within";
    PPointAt[PPointAt["After"] = 2] = "After";
})(PPointAt || (PPointAt = {}));
var PPoint = /** @class */ (function () {
    function PPoint(path, at, offset) {
        if (offset === void 0) { offset = -1; }
        this.path = path;
        this.at = at;
        this.offset = offset;
    }
    return PPoint;
}());
exports.PPoint = PPoint;
var PNodeContent = /** @class */ (function () {
    function PNodeContent(nodes, text) {
        this.nodes = nodes;
        this.text = text;
    }
    PNodeContent.prototype.children = function () {
        return this.nodes;
    };
    PNodeContent.prototype.textContent = function () {
        return this.text;
    };
    return PNodeContent;
}());
exports.PNodeContent = PNodeContent;
var PNode = /** @class */ (function () {
    function PNode(id, content) {
        this.id = id;
        this.content = content;
    }
    PNode.prototype.fromJSON = function (json) {
        var _this = this;
        if (json instanceof PNode) {
            return json;
        }
        var _a = json.nodes, nodes = _a === void 0 ? [] : _a, text = json.text;
        var children = nodes.map(function (n) { return _this.fromJSON(n); });
        var content = new PNodeContent(children, text);
        return new PNode(json.id, content);
    };
    return PNode;
}());
exports.PNode = PNode;
