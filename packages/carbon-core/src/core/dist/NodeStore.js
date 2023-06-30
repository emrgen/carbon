"use strict";
exports.__esModule = true;
exports.NodeStore = void 0;
var NodeId_1 = require("./NodeId");
var NodeStore = /** @class */ (function () {
    function NodeStore() {
        this.deletedNodeMap = new Map();
        this.nodeMap = new Map();
        this.elementMap = new Map();
        this.elementToNodeMap = new WeakMap();
    }
    NodeStore.prototype.nodes = function () {
        return Array.from(this.nodeMap.values());
    };
    NodeStore.prototype.elements = function () {
        return Array.from(this.elementMap.values());
    };
    NodeStore.prototype.entries = function () {
        var _this = this;
        return this.nodes().map(function (n) { return [n, _this.element(n.id)]; });
    };
    NodeStore.prototype.reset = function () {
        this.deletedNodeMap.clear();
        this.nodeMap.clear();
        this.elementMap.clear();
        this.elementToNodeMap = new WeakMap();
    };
    NodeStore.prototype.getById = function (id) {
        return this.nodeMap.get(id);
    };
    NodeStore.prototype.get = function (entry) {
        var _a;
        var nodeId = entry;
        if (nodeId instanceof NodeId_1.NodeId) {
            return (_a = this.nodeMap.get(nodeId.id)) !== null && _a !== void 0 ? _a : this.deletedNodeMap.get(nodeId.id);
        }
        else {
            return this.elementToNodeMap.get(entry);
        }
    };
    NodeStore.prototype.put = function (node) {
        // console.log('put node', node.id.toString());
        this.deletedNodeMap["delete"](node.id.id);
        this.nodeMap["delete"](node.id.id);
        this.nodeMap.set(node.id.id, node);
    };
    NodeStore.prototype.element = function (nodeId) {
        return this.elementMap.get(nodeId.id);
    };
    // connect the node to the rendered HTML element
    NodeStore.prototype.register = function (node, el) {
        if (!el) {
            console.error("Registering empty dom node for " + node.id.toString());
            return;
        }
        var nodeId = node.id;
        var id = nodeId.id;
        // remove old reference first
        // other part of the id will eventually be added while rendering
        this["delete"](node);
        // console.log('register node', node.id.toString());
        this.nodeMap.set(id, node);
        this.elementMap.set(id, el);
        this.elementToNodeMap.set(el, node);
    };
    NodeStore.prototype["delete"] = function (node) {
        var nodeId = node.id;
        var id = nodeId.id;
        var el = this.elementMap.get(id);
        if (el) {
            this.elementToNodeMap["delete"](el);
        }
        this.nodeMap["delete"](id);
        this.elementMap["delete"](id);
        this.deletedNodeMap.set(id, node);
    };
    NodeStore.prototype.deleted = function (nodeId) {
        var id = nodeId.id;
        return this.deletedNodeMap.get(id);
    };
    NodeStore.prototype.resolve = function (el) {
        if (!el)
            return;
        var node;
        do {
            node = this.elementToNodeMap.get(el);
            if (node) {
                break;
            }
            else {
                el = el.parentNode;
            }
        } while (el);
        return node;
    };
    return NodeStore;
}());
exports.NodeStore = NodeStore;
