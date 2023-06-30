"use strict";
exports.__esModule = true;
exports.NodeEmitter = exports.NodeTopicEmitter = void 0;
var lodash_1 = require("lodash");
var sorted_btree_1 = require("sorted-btree");
var BTree_1 = require("./BTree");
var NodeId_1 = require("./NodeId");
// handles events by executing registered callbacks
var NodeTopicEmitter = /** @class */ (function () {
    function NodeTopicEmitter() {
        this.subscribers = new Map();
    }
    NodeTopicEmitter.prototype.publish = function (event, node) {
        var _a;
        console.log('publish', event, node.id, node.version, node.textContent);
        var listeners = (_a = this.subscribers.get(event)) === null || _a === void 0 ? void 0 : _a.get(node.id);
        // console.log(listeners);
        listeners === null || listeners === void 0 ? void 0 : listeners.forEach(function (cb) { return cb(node); });
    };
    NodeTopicEmitter.prototype.subscribe = function (id, event, cb) {
        var _a, _b, _c;
        if (!this.subscribers.has(event)) {
            this.subscribers.set(event, new BTree_1.NodeBTree());
        }
        var listeners = (_b = (_a = this.subscribers.get(event)) === null || _a === void 0 ? void 0 : _a.get(id)) !== null && _b !== void 0 ? _b : new Set();
        listeners.add(cb);
        (_c = this.subscribers.get(event)) === null || _c === void 0 ? void 0 : _c.set(id, listeners);
    };
    NodeTopicEmitter.prototype.unsubscribe = function (id, event, cb) {
        var _a, _b;
        (_b = (_a = this.subscribers.get(event)) === null || _a === void 0 ? void 0 : _a.get(id)) === null || _b === void 0 ? void 0 : _b["delete"](cb);
    };
    return NodeTopicEmitter;
}());
exports.NodeTopicEmitter = NodeTopicEmitter;
// pub-sub for any node by id
// publish will notify all subscribers of the node
var NodeEmitter = /** @class */ (function () {
    function NodeEmitter() {
        this.subscribers = new sorted_btree_1["default"](undefined, NodeId_1.NodeIdComparator);
    }
    // subscribe to node by id
    NodeEmitter.prototype.subscribe = function (id, cb) {
        var _this = this;
        var _a;
        var listeners = (_a = this.subscribers.get(id)) !== null && _a !== void 0 ? _a : [];
        listeners.push(cb);
        this.subscribers.set(id, listeners);
        return function () {
            _this.unsubscribe(id, cb);
        };
    };
    // unsubscribe from node by id
    NodeEmitter.prototype.unsubscribe = function (id, cb) {
        var _a;
        var listeners = (_a = this.subscribers.get(id)) !== null && _a !== void 0 ? _a : [];
        this.subscribers.set(id, listeners.filter(function (w) { return w !== cb; }));
    };
    // publish updated node to all subscribers
    NodeEmitter.prototype.publish = function (node) {
        var _a;
        if (node) {
            var listeners = (_a = this.subscribers.get(node.id)) !== null && _a !== void 0 ? _a : [];
            console.log(node.name, node.id.toString(), listeners, Array.from(this.subscribers.keys()).map(function (n) { return n.toString(); }));
            lodash_1.each(listeners, function (cb) { return cb(node); });
        }
    };
    return NodeEmitter;
}());
exports.NodeEmitter = NodeEmitter;
