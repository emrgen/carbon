"use strict";
exports.__esModule = true;
exports.NodeAttrs = void 0;
var lodash_1 = require("lodash");
var NodeAttrs = /** @class */ (function () {
    function NodeAttrs(attrs) {
        var _a, _b;
        this.html = {};
        this.node = {};
        this.html = (_a = attrs.html) !== null && _a !== void 0 ? _a : {};
        this.node = (_b = attrs.node) !== null && _b !== void 0 ? _b : {};
    }
    NodeAttrs.prototype.update = function (attrs) {
        var html = lodash_1.merge(lodash_1.cloneDeep(this.html), attrs.html);
        var node = lodash_1.merge(lodash_1.cloneDeep(this.node), attrs.node);
        return new NodeAttrs({ html: html, node: node });
    };
    return NodeAttrs;
}());
exports.NodeAttrs = NodeAttrs;
