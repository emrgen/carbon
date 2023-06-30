"use strict";
exports.__esModule = true;
exports.NodeType = void 0;
var lodash_1 = require("lodash");
var ContentMatch_1 = require("./ContentMatch");
var Mark_1 = require("./Mark");
var defaultAttrs = {};
var specGroups = function (name, spec) {
    var groups = new Set(spec.group ? spec.group.split(" ") : []);
    var isBlock = !(spec.inline || name == "text");
    if (isBlock) {
        groups.add('block');
    }
    else {
        groups.add('inline');
    }
    return Array.from(groups);
};
var defaultSpec = {
// collapsable: false,
// selectable: true,
// atom: false,
// group: '',
// content: '',
// marks: '',
// inline: false,
};
var NodeType = /** @class */ (function () {
    // name: name of the node
    // schema: back reference to editor schema
    // spec: spec of the NodeType
    function NodeType(name, schema, spec) {
        var _a;
        this.name = name;
        this.schema = schema;
        this.spec = spec;
        this.groupsNames = specGroups(name, spec);
        this.attrs = lodash_1.merge({ node: {}, html: {} }, (_a = spec.attrs) !== null && _a !== void 0 ? _a : {});
        this.isBlock = !(spec.inline || name == "text");
        this.isText = name == "text";
        this.markSet = new Mark_1.MarkSet();
        this.contents = [];
    }
    NodeType.compile = function (specs, schema) {
        var nodes = {};
        lodash_1.each(specs, function (spec, name) {
            // console.log(merge(defaultSpec, spec));
            nodes[name] = new NodeType(name, schema, spec);
        });
        return nodes;
    };
    NodeType.prototype.computeContents = function () {
        var _a;
        var nodes = this.schema.nodes;
        var nodeGroups = {};
        // generate groupName to nodeName map
        // for a nodeName create a temporary group
        lodash_1.each(nodes, function (type, name) {
            if (!type.isDraggable)
                return;
            nodeGroups[name] = new Set([name]);
            lodash_1.each(type.groups, function (groupName) {
                var _a;
                nodeGroups[groupName] = (_a = nodeGroups[groupName]) !== null && _a !== void 0 ? _a : new Set();
                nodeGroups[groupName].add(name);
            });
        });
        var contents = new Set();
        var childGroups = (_a = this.spec.content) === null || _a === void 0 ? void 0 : _a.match(/[a-zA-Z]+/gi);
        lodash_1.each(childGroups, function (childGroupName) {
            var _a;
            (_a = nodeGroups[childGroupName]) === null || _a === void 0 ? void 0 : _a.forEach(function (childName) {
                contents.add(childName);
            });
        });
        this.contents = Array.from(contents);
    };
    Object.defineProperty(NodeType.prototype, "parents", {
        get: function () {
            var _this = this;
            var parents = new Set();
            lodash_1.each(this.schema.nodes, function (n) {
                if (n.contents.includes(_this.name)) {
                    parents.add(n.name);
                }
            });
            return parents;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(NodeType.prototype, "Tag", {
        get: function () {
            var _a;
            return (_a = this.spec.tag) !== null && _a !== void 0 ? _a : 'div';
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(NodeType.prototype, "groups", {
        get: function () {
            return this.groupsNames;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(NodeType.prototype, "dragHandle", {
        get: function () {
            return this.spec.dragHandle;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(NodeType.prototype, "isCollapsible", {
        get: function () {
            return this.spec.collapsible;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(NodeType.prototype, "isContainer", {
        get: function () {
            return !!this.spec.container;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(NodeType.prototype, "splits", {
        get: function () {
            return !!this.spec.splits;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(NodeType.prototype, "splitName", {
        get: function () {
            var _a;
            return (_a = this.spec.splitName) !== null && _a !== void 0 ? _a : 'section';
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(NodeType.prototype, "canSplit", {
        get: function () {
            return false;
            // return [...listNames, 'title'].includes(this.name);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(NodeType.prototype, "isInline", {
        get: function () {
            return !this.isBlock;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(NodeType.prototype, "isEmbedding", {
        get: function () {
            return !!this.spec.embedding;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(NodeType.prototype, "isTextBlock", {
        get: function () {
            return this.isBlock && this.inlineContent;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(NodeType.prototype, "isAtom", {
        get: function () {
            return !!this.spec.atom;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(NodeType.prototype, "isIsolating", {
        get: function () {
            return !!this.spec.isolating;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(NodeType.prototype, "isDraggable", {
        get: function () {
            return !!this.spec.draggable;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(NodeType.prototype, "isSelectable", {
        get: function () {
            return !!this.spec.selectable;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(NodeType.prototype, "isSandbox", {
        get: function () {
            return !!this.spec.sandbox;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(NodeType.prototype, "isFocusable", {
        get: function () {
            return !!this.spec.focusable;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(NodeType.prototype, "whitespace", {
        get: function () {
            return this.spec.whitespace || (this.spec.code ? "pre" : "normal");
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(NodeType.prototype, "isLeaf", {
        get: function () {
            return this.contentMatch == ContentMatch_1.ContentMatch.empty;
        },
        enumerable: false,
        configurable: true
    });
    NodeType.prototype.hasRequiredAttrs = function () {
        // console.warn('hasRequiredAttrs is not implemented');
        return false;
    };
    // create a default node based on schema
    NodeType.prototype["default"] = function () {
        console.log(this.name);
        if (this.isText) {
            return this.schema.text('');
        }
        var blockJson = {
            name: this.name,
            content: []
        };
        var contentMatch = this.contentMatch;
        if (contentMatch.validEnd) {
            return this.schema.nodeFromJSON(blockJson);
        }
        while (contentMatch) {
            var nextEdges = contentMatch.next, defaultType = contentMatch.defaultType, validEnd = contentMatch.validEnd;
            if (validEnd || !nextEdges) {
                break;
            }
            if (defaultType) {
                blockJson.content.push(defaultType["default"]());
            }
            contentMatch = nextEdges[0].next;
        }
        console.log(blockJson);
        var node = this.schema.nodeFromJSON(blockJson);
        if (!node) {
            throw new Error('node is null');
        }
        return node;
    };
    NodeType.prototype.create = function (content) {
        if (this.isText) {
            return this.schema.text(content);
        }
        return this.schema.node(this.name, { content: content });
    };
    NodeType.prototype.eq = function (other) {
        return this.name === other.name;
    };
    //
    NodeType.prototype.createAndFill = function () { };
    // allowsMarkType(markType: MarkType) {
    // 	return this.markSet == null || this.markSet.indexOf(markType) > -1
    // }
    // validContent(content: Fragment) {
    // 	let result = this.contentMatch.matchFragment(content)
    // 	if (!result || !result.validEnd) return false
    // 	for (let i = 0;i < content.childCount;i++)
    // 		if (!this.allowsMarks(content.child(i).marks)) return false
    // 	return true
    // }
    NodeType.prototype.checkContent = function (content) {
        // if (!this.validContent(content))
        // 	throw new RangeError(`Invalid content for node ${this.name}: ${content.toString().slice(0, 50)}`)
    };
    return NodeType;
}());
exports.NodeType = NodeType;
