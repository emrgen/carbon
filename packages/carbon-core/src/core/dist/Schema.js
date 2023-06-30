"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
exports.__esModule = true;
exports.Schema = void 0;
var lodash_1 = require("lodash");
var ContentMatch_1 = require("./ContentMatch");
var Node_1 = require("./Node");
var NodeType_1 = require("./NodeType");
// ref: prosemirror-model/src/schema.js
var Schema = /** @class */ (function () {
    function Schema(spec, factory) {
        this.factory = factory;
        this.nodes = NodeType_1.NodeType.compile(spec.nodes, this);
        this.marks = {};
        var contextExprCache = {};
        for (var nodeName in this.nodes) {
            if (nodeName in this.marks) {
                // console.log(nodeName in this.marks, this.marks);
                throw new RangeError(nodeName + " can not be both a node and a mark");
            }
            var nodeType = this.nodes[nodeName];
            var contentExpr = nodeType.spec.content;
            var markExpr = nodeType.spec.marks;
            if (!nodeType) {
                throw new Error("NodeType is not found for " + nodeName + ". check if the node plugin is added");
            }
            if (contentExpr) {
                if (!contextExprCache[contentExpr]) {
                    contextExprCache[contentExpr] = ContentMatch_1.ContentMatch.parse(contentExpr, this.nodes);
                }
                nodeType.contentMatch = contextExprCache[contentExpr];
                nodeType.inlineContent = nodeType.contentMatch.inlineContent;
            }
            else {
                // console.log('empty content match for', nodeName);
                nodeType.contentMatch = ContentMatch_1.ContentMatch.empty;
                nodeType.inlineContent = false;
            }
            if (markExpr) { }
        }
        lodash_1.each(this.nodes, function (n) { return n.computeContents(); });
    }
    Schema.prototype.type = function (name) {
        var type = this.nodes[name];
        if (!type) {
            throw new Error("node type is not found: " + name);
        }
        return type;
    };
    Schema.prototype.text = function (text, json) {
        if (json === void 0) { json = {}; }
        return this.node('text', __assign({ text: text }, json));
    };
    Schema.prototype.node = function (name, json) {
        if (json === void 0) { json = {}; }
        return this.nodeFromJSON(__assign({ name: name }, json));
    };
    Schema.prototype.cloneWithId = function (node) {
        return this.factory.cloneWithId(node);
    };
    // create node from json
    Schema.prototype.nodeFromJSON = function (json) {
        if (json instanceof Node_1.Node) {
            return json;
        }
        return this.factory.createNode(json, this);
        // const { name, id, text = '', content = [], attrs = {}, target = '' } = json ?? {};
        // const type = this.type(name);
        // if (!type) {
        // 	// console.log(...lp('error'), 'type not found for node:', name, json);
        // 	throw new Error("node type is not found" + name);
        // }
        // const nodes = content.map(c => this.nodeFromJSON(c, store, false)).filter(identity);
        // const nodeContent: NodeContent = type.isText ? InlineContent.create(text) : BlockContent.create(nodes);
        // const nodeId = generateID(id, type.isText ? text.length : 1);
        // console.log(nodeId.toJSON());
        // if (attrs.node?.proxy) {
        // 	const node = NodeProxy.createShadow(id, type, attrs);
        // 	store.put(node)
        // 	return node;
        // }
        // console.log('NEW NODE ID', nodeId.toString());
        // const node = Node.create({ id: nodeId, type, content: nodeContent, attrs });
        // store.put(node)
        // console.log/(name, node)
        // replace shadow nodes with proxy nodes
        // if (start) {
        // 	const done = {}
        // 	store.proxy.forEach(pn => {
        // 		const targetId = parseID(pn.attrs.node?.proxy);
        // 		if (!targetId) {
        // 			throw new Error("Failed to parse proxy target Id");
        // 		}
        // 		const target = store.nodes.get(targetId);
        // 		if (!target) {
        // 			throw new Error("Failed to get proxy target Node");
        // 		}
        // 		node.parent?.replace(pn, NodeProxy.createProxy(target))
        // 	});
        // }
        // return node;
    };
    return Schema;
}());
exports.Schema = Schema;
var NodeLayout;
(function (NodeLayout) {
    NodeLayout[NodeLayout["horizontal"] = 0] = "horizontal";
    NodeLayout[NodeLayout["vertical"] = 1] = "vertical";
    NodeLayout[NodeLayout["grid"] = 2] = "grid";
})(NodeLayout || (NodeLayout = {}));
