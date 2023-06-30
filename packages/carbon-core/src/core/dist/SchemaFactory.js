"use strict";
exports.__esModule = true;
exports.SchemaFactory = void 0;
var Node_1 = require("./Node");
var NodeId_1 = require("./NodeId");
var NodeContent_1 = require("./NodeContent");
var utils_1 = require("./actions/utils");
var SchemaFactory = /** @class */ (function () {
    function SchemaFactory() {
    }
    SchemaFactory.prototype.createNode = function (json, schema) {
        var name = json.name, _a = json.content, contentNodes = _a === void 0 ? [] : _a, text = json.text, _b = json.attrs, attrs = _b === void 0 ? {} : _b;
        var type = schema.type(name);
        if (!type) {
            throw new Error("Node Plugin is not registered " + name);
        }
        if (name === 'text') {
            var content = NodeContent_1.InlineContent.create(text);
            var id = NodeId_1.NodeId.create(utils_1.generateTextId());
            return Node_1.Node.create({ id: id, type: type, content: content, attrs: attrs });
        }
        else {
            var id = NodeId_1.NodeId.create(utils_1.generateBlockId());
            var nodes = contentNodes.map(function (n) { return schema.nodeFromJSON(n); });
            var content = NodeContent_1.BlockContent.create(nodes);
            return Node_1.Node.create({ id: id, type: type, content: content, attrs: attrs });
        }
    };
    SchemaFactory.prototype.cloneWithId = function (node) {
        var clone = node.clone();
        clone.forAll(function (n) {
            if (n.name === 'text') {
                n.id = NodeId_1.NodeId.create(utils_1.generateTextId());
            }
            else {
                n.id = NodeId_1.NodeId.create(utils_1.generateBlockId());
            }
        });
        clone.parent = null;
        return clone;
    };
    return SchemaFactory;
}());
exports.SchemaFactory = SchemaFactory;
