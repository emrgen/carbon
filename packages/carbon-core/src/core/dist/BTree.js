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
exports.NodeBTree = void 0;
var sorted_btree_1 = require("sorted-btree");
var NodeId_1 = require("./NodeId");
var NodeBTree = /** @class */ (function (_super) {
    __extends(NodeBTree, _super);
    function NodeBTree() {
        return _super.call(this, undefined, NodeId_1.NodeIdComparator) || this;
    }
    return NodeBTree;
}(sorted_btree_1["default"]));
exports.NodeBTree = NodeBTree;
