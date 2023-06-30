"use strict";
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
exports.__esModule = true;
exports.InlineContent = exports.BlockContent = void 0;
var lodash_1 = require("lodash");
var BlockContent = /** @class */ (function () {
    function BlockContent(props) {
        this.nodes = props.nodes;
    }
    Object.defineProperty(BlockContent.prototype, "children", {
        get: function () {
            return this.nodes;
        },
        enumerable: false,
        configurable: true
    });
    BlockContent.create = function (nodes) {
        return new BlockContent({ nodes: nodes });
    };
    Object.defineProperty(BlockContent.prototype, "size", {
        get: function () {
            return this.children.length;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(BlockContent.prototype, "textContent", {
        get: function () {
            return this.children.reduce(function (text, node) { return text + node.textContent; }, '');
        },
        enumerable: false,
        configurable: true
    });
    BlockContent.prototype.withParent = function (parent) {
        this.nodes.forEach(function (n) { return n.setParent(parent); });
        return this;
    };
    BlockContent.prototype.indexOf = function (node) {
        return lodash_1.findIndex(this.nodes, function (n) {
            return node.id.comp(n.id) === 0;
        });
    };
    BlockContent.prototype.insert = function (fragment, offset) {
        return this;
    };
    BlockContent.prototype.append = function (fragment) {
        return BlockContent.create(__spreadArrays(this.nodes, fragment.nodes));
    };
    BlockContent.prototype.replace = function (node, fragment) {
        var nodes = this.nodes.map(function (n) {
            if (n.eq(node)) {
                return fragment.nodes;
            }
            else {
                return n;
            }
        });
        return BlockContent.create(lodash_1.flatten(nodes));
    };
    BlockContent.prototype.insertBefore = function (fragment, node) {
        var nodes = this.nodes;
        var index = this.indexOf(node);
        var content = lodash_1.flatten([nodes.slice(0, index), fragment.nodes, nodes.slice(index)]);
        return BlockContent.create(content);
    };
    BlockContent.prototype.insertAfter = function (fragment, node) {
        var nodes = this.nodes;
        var index = this.indexOf(node);
        var content = lodash_1.flatten([nodes.slice(0, index + 1), fragment.nodes, nodes.slice(index + 1)]);
        return BlockContent.create(content);
    };
    BlockContent.prototype.remove = function (node) {
        var nodes = this.nodes;
        var found = nodes.find(function (n) { return n.eq(node); });
        this.nodes = nodes.filter(function (n) { return n !== found; });
        return !!found;
    };
    BlockContent.prototype.view = function (container) {
        return BlockContent.create(this.nodes.map(function (n) { return n.view(container); }));
    };
    BlockContent.prototype.destroy = function () { };
    BlockContent.prototype.updateText = function (text) {
        throw new Error("Not implemented");
    };
    BlockContent.prototype.clone = function () {
        return BlockContent.create(this.nodes.map(function (n) { return n.clone(); }));
    };
    BlockContent.prototype.toJSON = function () {
        return {
            content: this.nodes.map(function (n) { return n.toJSON(); })
        };
    };
    return BlockContent;
}());
exports.BlockContent = BlockContent;
var InlineContent = /** @class */ (function () {
    function InlineContent(props) {
        this.text = props.text;
    }
    Object.defineProperty(InlineContent.prototype, "children", {
        get: function () {
            return [];
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(InlineContent.prototype, "nodes", {
        get: function () {
            return [];
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(InlineContent.prototype, "size", {
        get: function () {
            return this.text.length;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(InlineContent.prototype, "textContent", {
        get: function () {
            return this.text;
        },
        enumerable: false,
        configurable: true
    });
    InlineContent.create = function (text) {
        return InlineContent.fromProps({ text: text });
    };
    InlineContent.fromProps = function (props) {
        return new InlineContent(props);
    };
    // setProps(props: TextContentProps): void {
    // 	this.text = props.text;
    // }
    InlineContent.prototype.destroyShallow = function () {
        throw new Error('Method not implemented.');
    };
    InlineContent.prototype.withParent = function (parent) {
        return this;
    };
    InlineContent.prototype.append = function (fragment) {
        throw new Error("Not implemented");
    };
    InlineContent.prototype.replace = function (node, fragment) {
        throw new Error("Not implemented");
    };
    InlineContent.prototype.insert = function (fragment, offset) {
        throw new Error("Not implemented");
    };
    InlineContent.prototype.insertBefore = function (fragment, node) {
        throw new Error("Not implemented");
    };
    InlineContent.prototype.insertAfter = function (fragment, node) {
        throw new Error("Not implemented");
    };
    InlineContent.prototype.remove = function (node) {
        return false;
    };
    InlineContent.prototype.split = function (offset) {
        return [this, this];
    };
    InlineContent.prototype.updateText = function (text) {
        this.text = text;
    };
    InlineContent.prototype.view = function () {
        return this;
    };
    InlineContent.prototype.clone = function () {
        return InlineContent.create(this.text);
    };
    InlineContent.prototype.destroy = function () { };
    InlineContent.prototype.toJSON = function () {
        return {
            text: this.textContent
        };
    };
    return InlineContent;
}());
exports.InlineContent = InlineContent;
