"use strict";
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
exports.__esModule = true;
exports.Fragment = void 0;
// a list of nodes
var Fragment = /** @class */ (function () {
    function Fragment(content, nodeSelection) {
        if (nodeSelection === void 0) { nodeSelection = false; }
        this.content = content;
        this.nodeSelection = nodeSelection;
    }
    Fragment.fromNode = function (node) {
        return Fragment.from([node]);
    };
    Fragment.from = function (nodes, nodeSelection) {
        if (nodeSelection === void 0) { nodeSelection = false; }
        return new Fragment(nodes, nodeSelection);
    };
    Object.defineProperty(Fragment.prototype, "isEmpty", {
        get: function () {
            return this.content.length === 0;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Fragment.prototype, "nodes", {
        get: function () {
            return this.content;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Fragment.prototype, "ids", {
        get: function () {
            return this.content.map(function (n) { return n.id; });
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Fragment.prototype, "childCount", {
        get: function () {
            return this.nodes.length;
        },
        enumerable: false,
        configurable: true
    });
    Fragment.prototype.child = function (index) {
        return this.nodes[index];
    };
    Fragment.prototype.insertBefore = function (node) {
        return Fragment.from(__spreadArrays([node], this.nodes));
    };
    Fragment.prototype.insertAfter = function (node) {
        return Fragment.from(__spreadArrays(this.nodes, [node]));
    };
    Fragment.prototype.destroy = function () {
    };
    // process each node inside the fragment
    Fragment.prototype.forEach = function (fn) {
        this.nodes.forEach(fn);
    };
    // traverse all nodes inside the fragment
    Fragment.prototype.forAll = function (fn) {
        this.nodes.forEach(function (n) { return n.preorder(function (ch) {
            fn(ch);
            return false;
        }); });
    };
    Fragment.empty = new Fragment([]);
    return Fragment;
}());
exports.Fragment = Fragment;
