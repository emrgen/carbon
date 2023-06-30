"use strict";
exports.__esModule = true;
exports.NodeProps = void 0;
var lodash_1 = require("lodash");
var NodeProps = /** @class */ (function () {
    function NodeProps() {
        this.html = {};
        this.node = {};
    }
    NodeProps.prototype.update = function (data) {
        var html = lodash_1.merge(lodash_1.cloneDeep(this.html), data.html);
        var node = lodash_1.merge(lodash_1.cloneDeep(this.node), data.node);
        this.html = html;
        this.node = node;
    };
    return NodeProps;
}());
exports.NodeProps = NodeProps;
