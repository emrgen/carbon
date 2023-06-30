"use strict";
exports.__esModule = true;
exports.NodeData = void 0;
var lodash_1 = require("lodash");
var NodeData = /** @class */ (function () {
    function NodeData(state, html, node) {
        if (state === void 0) { state = { active: false, selected: false }; }
        if (html === void 0) { html = {}; }
        if (node === void 0) { node = {}; }
        this.state = { active: false, selected: false };
        this.state = state;
        this.html = html;
        this.node = node;
    }
    NodeData.prototype.update = function (data) {
        var state = data.state, html = data.html, node = data.node;
        this.state = lodash_1.merge(lodash_1.cloneDeep(this.state), state);
        this.html = lodash_1.merge(lodash_1.cloneDeep(this.html), html);
        this.node = lodash_1.merge(lodash_1.cloneDeep(this.node), node);
    };
    return NodeData;
}());
exports.NodeData = NodeData;
