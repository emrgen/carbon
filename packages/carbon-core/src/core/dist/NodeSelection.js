"use strict";
exports.__esModule = true;
exports.NodeSelection = void 0;
var NodeSelection = /** @class */ (function () {
    function NodeSelection(store, nodeIds) {
        this.nodeIds = nodeIds;
        this.store = store;
    }
    Object.defineProperty(NodeSelection.prototype, "nodes", {
        get: function () {
            var _this = this;
            var nodes = this.nodeIds.map(function (id) {
                var _a;
                var node = _this.store.get(id);
                return {
                    node: node,
                    path: ((_a = node === null || node === void 0 ? void 0 : node.path) !== null && _a !== void 0 ? _a : [])
                };
            });
            console.log(nodes);
            nodes.sort(function (a, b) {
                var aPath = a.path;
                var bPath = b.path;
                for (var i = 0, size = Math.min(aPath.length, bPath.length); i < size; i++) {
                    if (aPath[i] < bPath[i]) {
                        return -1;
                    }
                    if (aPath[i] > bPath[i]) {
                        return 1;
                    }
                }
                if (aPath.length < bPath.length) {
                    return -1;
                }
                if (aPath.length > bPath.length) {
                    return 1;
                }
                return 0;
            });
            console.log(nodes.map(function (n) { return n.node.id.toString(); }));
            return nodes.map(function (n) { return n.node; });
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(NodeSelection.prototype, "isEmpty", {
        get: function () {
            return this.nodeIds.size === 0;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(NodeSelection.prototype, "size", {
        get: function () {
            return this.nodeIds.size;
        },
        enumerable: false,
        configurable: true
    });
    return NodeSelection;
}());
exports.NodeSelection = NodeSelection;
