"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;
exports.NodeIdSet = exports.DeleteSet = exports.BSet = void 0;
var lodash_1 = require("lodash");
var sorted_btree_1 = require("sorted-btree");
var NodeId_1 = require("./NodeId");
// A Btree based set
var BSet = /** @class */ (function () {
    function BSet(compare) {
        this.tree = new sorted_btree_1["default"](undefined, compare);
        this.compare = compare;
    }
    BSet.from = function (container, comparator) {
        var set = new BSet(comparator);
        container.forEach(function (c) { return set.add(c); });
        return set;
    };
    Object.defineProperty(BSet.prototype, "size", {
        get: function () {
            return this.tree.size;
        },
        enumerable: false,
        configurable: true
    });
    // this is within other
    BSet.prototype.eq = function (other) {
        return this.toArray().every(function (k) { return other.has(k); });
    };
    BSet.prototype.clear = function () {
        this.tree.clear();
    };
    BSet.prototype.add = function (entry) {
        this.tree.set(entry, entry);
        return this;
    };
    // returns this - other
    BSet.prototype.sub = function (other) {
        var result = new BSet();
        this.forEach(function (e) {
            if (!other.has(e)) {
                result.add(e);
            }
        });
        return result;
    };
    BSet.prototype.extend = function () {
        var _this = this;
        var sets = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            sets[_i] = arguments[_i];
        }
        lodash_1.each(sets, function (set) {
            set.forEach(function (e) { return _this.add(e); });
        });
    };
    BSet.prototype.remove = function (entry) {
        return this.tree["delete"](entry);
    };
    BSet.prototype.deleteKeys = function (entries) {
        return this.tree.deleteKeys(entries);
    };
    BSet.prototype.entries = function (firstKey) {
        return this.tree.keys(firstKey);
    };
    BSet.prototype.has = function (entry) {
        return this.tree.has(entry);
    };
    BSet.prototype.map = function (fn) {
        return this.toArray().map(fn);
    };
    BSet.prototype.forEach = function (callback) {
        var _this = this;
        this.tree.forEach(function (v) { return callback(v, _this); });
    };
    BSet.prototype.toArray = function () {
        return this.tree.keysArray();
    };
    BSet.prototype.clone = function () {
        var ret = new BSet(this.compare);
        this.forEach(function (e) { return ret.add(e); });
        return ret;
    };
    return BSet;
}());
exports.BSet = BSet;
// Set of deleted Item IDs
var DeleteSet = /** @class */ (function (_super) {
    __extends(DeleteSet, _super);
    function DeleteSet(app) {
        var _this = _super.call(this, NodeId_1.NodeIdComparator) || this;
        _this.app = app;
        return _this;
    }
    DeleteSet.prototype.shrink = function () {
        var app = this.app;
        var set = new DeleteSet(app);
        this.toArray()
            .map(function (id) { return app.store.get(id); })
            .forEach(function (n) {
            if ((n === null || n === void 0 ? void 0 : n.parent) && set.has(n.parent.id)) {
                set.remove(n.id);
            }
        });
        return set;
    };
    return DeleteSet;
}(BSet));
exports.DeleteSet = DeleteSet;
var NodeIdSet = /** @class */ (function (_super) {
    __extends(NodeIdSet, _super);
    function NodeIdSet() {
        return _super.call(this, NodeId_1.NodeIdComparator) || this;
    }
    return NodeIdSet;
}(BSet));
exports.NodeIdSet = NodeIdSet;
