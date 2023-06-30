"use strict";
exports.__esModule = true;
exports.SetContent = void 0;
var Logger_1 = require("../Logger");
var Result_1 = require("./Result");
var types_1 = require("./types");
var utils_1 = require("./utils");
var SetContent = /** @class */ (function () {
    function SetContent(nodeId, content, origin) {
        this.nodeId = nodeId;
        this.content = content;
        this.id = utils_1.generateActionId();
        this.origin = origin;
    }
    SetContent.create = function (nodeId, content, origin) {
        if (origin === void 0) { origin = types_1.ActionOrigin.UserInput; }
        return new SetContent(nodeId, content, origin);
    };
    SetContent.prototype.execute = function (tr) {
        var app = tr.app;
        var _a = this, nodeId = _a.nodeId, content = _a.content;
        var node = app.store.get(nodeId);
        if (!node) {
            return Result_1.ActionResult.withError("Node " + nodeId + " not found");
        }
        node === null || node === void 0 ? void 0 : node.updateContent(content);
        node.forAll(function (n) {
            app.store.put(n);
        });
        tr.updated(node);
        return Result_1.ActionResult.withValue('done');
    };
    SetContent.prototype.inverse = function () {
        throw new Error("Method not implemented.");
    };
    SetContent.prototype.toString = function () {
        var _a = this, nodeId = _a.nodeId, content = _a.content;
        return Logger_1.classString(this)([nodeId, content.children.map(function (n) { return n.textContent; })]);
    };
    return SetContent;
}());
exports.SetContent = SetContent;
