"use strict";
exports.__esModule = true;
exports.NodeIdComparator = exports.NodeId = void 0;
var uuid_1 = require("uuid");
var defaultId = uuid_1.v4().replace(/[0-9a-z]/g, '0');
var NodeId = /** @class */ (function () {
    function NodeId(id) {
        this.id = id;
    }
    Object.defineProperty(NodeId.prototype, "isDefault", {
        get: function () {
            return defaultId === this.id;
        },
        enumerable: false,
        configurable: true
    });
    NodeId.deserialize = function (id) {
        return new NodeId(id);
    };
    NodeId["default"] = function () {
        return new NodeId(defaultId);
    };
    NodeId.create = function (id) {
        return new NodeId(id);
    };
    NodeId.prototype.eq = function (other) {
        return this.comp(other) === 0;
    };
    NodeId.prototype.comp = function (other) {
        return this.id.localeCompare(other.id);
    };
    NodeId.prototype.clone = function () {
        return NodeId.create(this.id);
    };
    NodeId.prototype.toString = function () {
        return this.id;
    };
    NodeId.prototype.toJSON = function () {
        var id = this.id;
        return {
            id: id
        };
    };
    NodeId.prototype.serialize = function () {
        return this.id;
    };
    return NodeId;
}());
exports.NodeId = NodeId;
exports.NodeIdComparator = function (a, b) {
    return a.comp(b);
};
