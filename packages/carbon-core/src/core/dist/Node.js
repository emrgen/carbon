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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
exports.__esModule = true;
exports.NodeComparator = exports.Node = void 0;
var lodash_1 = require("lodash");
var Fragment_1 = require("./Fragment");
var events_1 = require("events");
var array_1 = require("../utils/array");
var Logger_1 = require("./Logger");
var Mark_1 = require("./Mark");
var NodeAttrs_1 = require("./NodeAttrs");
var NodeData_1 = require("./NodeData");
var types_1 = require("./types");
var key = 0;
var nextKey = function () { return key++; };
var Node = /** @class */ (function (_super) {
    __extends(Node, _super);
    function Node(object) {
        var _this = _super.call(this) || this;
        _this.renderVersion = 0;
        _this.updateVersion = 0;
        var id = object.id, type = object.type, content = object.content, _a = object.marks, marks = _a === void 0 ? Mark_1.MarkSet.empty() : _a, _b = object.attrs, attrs = _b === void 0 ? {} : _b, _c = object.data, data = _c === void 0 ? {} : _c, _d = object.renderVersion, renderVersion = _d === void 0 ? 0 : _d, _e = object.updateVersion, updateVersion = _e === void 0 ? 0 : _e;
        _this.test_key = nextKey();
        _this.id = id;
        _this.type = type;
        _this.content = content.withParent(_this);
        _this.marks = marks;
        _this.attrs = new NodeAttrs_1.NodeAttrs(lodash_1.merge(lodash_1.cloneDeep(type.attrs), attrs));
        _this.data = new NodeData_1.NodeData();
        _this.renderVersion = renderVersion;
        _this.updateVersion = updateVersion;
        return _this;
    }
    Node.removeId = function (json) {
        var id = json.id, _a = json.text, text = _a === void 0 ? '' : _a, _b = json.content, content = _b === void 0 ? [] : _b, rest = __rest(json, ["id", "text", "content"]);
        if (text) {
            return rest;
        }
        return __assign({ content: content.map(function (n) { return Node.removeId(n); }) }, rest);
    };
    Node.create = function (object) {
        return new Node(object);
    };
    Node.prototype.syncChildren = function () { };
    Node.prototype.syncAttrs = function () { };
    Node.prototype.syncData = function () { };
    Node.prototype.syncMarks = function () { };
    Object.defineProperty(Node.prototype, "key", {
        get: function () {
            return this.id.id;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Node.prototype, "version", {
        get: function () {
            var _a = this, id = _a.id, updateVersion = _a.updateVersion;
            return id.id + "(" + updateVersion + ")";
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Node.prototype, "placeholder", {
        get: function () {
            return this.type.attrs.html.placeholder;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Node.prototype, "canSplit", {
        get: function () {
            return this.type.canSplit;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Node.prototype, "canMerge", {
        // nodes that are not allowed to merge with any other node
        get: function () {
            return !this.type.isIsolating && !this.isAtom;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Node.prototype, "isDirty", {
        get: function () {
            return this.renderVersion < this.updateVersion;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Node.prototype, "name", {
        get: function () {
            return this.type.name;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Node.prototype, "isActive", {
        get: function () {
            return this.data.state.active;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Node.prototype, "isSelected", {
        get: function () {
            return this.data.state.selected;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Node.prototype, "size", {
        get: function () {
            if (this.isInlineAtom)
                return 1;
            if (this.isBlockAtom)
                return 0;
            return this.content.size;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Node.prototype, "focusSize", {
        // starting from left of <a> to before of </a>
        // if total focus size is needed for a block, need to add 1
        // used in Position
        // get stepSize() {
        // 	if (this.stepSizeCache) {
        // 		return this.stepSizeCache
        // 	}
        // 	if (this.isText) {
        // 		this.stepSizeCache = this.size
        // 	} else if (this.isVoid) {
        // 		this.stepSizeCache = 2
        // 	} else if (this.isAtom) {
        // 		this.stepSizeCache = 1
        // 	} else {
        // 		this.stepSizeCache = 2 + this.children.reduce((s, ch) => s + ch.stepSize, 0);
        // 	}
        // 	return this.stepSizeCache;
        // }
        // focus steps count within the node
        // start and end locations are within the node
        get: function () {
            var _a, _b;
            if (this.isInlineAtom)
                return (_b = (_a = this.attrs.node) === null || _a === void 0 ? void 0 : _a.size) !== null && _b !== void 0 ? _b : 1;
            // if (this.isEmpty && this.isInline) return 1
            // if (this.isEmpty || this.isInlineAtom) return 1;
            // if (this.isBlockAtom) return 0;
            if (this.isText)
                return this.textContent.length;
            var focusSize = this.children.reduce(function (fs, n) {
                return fs + n.focusSize;
            }, 0);
            return focusSize;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Node.prototype, "hasFocusable", {
        // focus can be within the node, including any descendants node
        get: function () {
            var _this = this;
            if (!this.isBlock)
                return false;
            if (this.isBlock && this.isFocusable && this.isEmpty)
                return true;
            return this.find(function (n) {
                if (n.eq(_this))
                    return false;
                return n.isFocusable;
            });
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Node.prototype, "isTextBlock", {
        get: function () {
            return this.type.isTextBlock;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Node.prototype, "isFocusable", {
        // focus can be within the node(ex: text node), excluding any child node
        get: function () {
            return ((this.isTextBlock && this.isEmpty) || !!this.type.isFocusable) && !this.isCollapseHidden;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Node.prototype, "isSelectable", {
        // a node that does not avoids to have a focus moved in by arrow keys
        get: function () {
            var nonSelectable = this.chain.find(function (n) { return !(n.type.isSelectable || n.isActive); });
            // console.log(nonSelectable);
            return !nonSelectable;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Node.prototype, "isCollapseHidden", {
        // if content node i.e. first child is treated as content node
        // check if parent is collapse hidden
        get: function () {
            var _a, _b;
            if (!this.isContentNode && ((_a = this.parent) === null || _a === void 0 ? void 0 : _a.isCollapsed)) {
                return true;
            }
            return (_b = this.parent) === null || _b === void 0 ? void 0 : _b.isCollapseHidden;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Node.prototype, "isEmbedding", {
        get: function () {
            return this.type.isEmbedding;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Node.prototype, "isAtom", {
        get: function () {
            return this.type.isAtom;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Node.prototype, "isContentNode", {
        get: function () {
            return this.index == 0;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Node.prototype, "isProxy", {
        get: function () {
            return false;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Node.prototype, "isCollapsed", {
        get: function () {
            return !!this.attrs.node.collapsed;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Node.prototype, "children", {
        get: function () {
            return this.content.children;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Node.prototype, "firstChild", {
        get: function () {
            return lodash_1.first(this.children);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Node.prototype, "lastChild", {
        get: function () {
            return lodash_1.last(this.children);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Node.prototype, "root", {
        get: function () {
            return lodash_1.last(this.parents);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Node.prototype, "path", {
        get: function () {
            return lodash_1.reverse(this.chain.map(function (n) { return n.index; }).slice(0, -1));
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Node.prototype, "prevSibling", {
        get: function () {
            var _a;
            return (_a = this.parent) === null || _a === void 0 ? void 0 : _a.children[this.index - 1];
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Node.prototype, "nextSibling", {
        get: function () {
            var _a;
            return (_a = this.parent) === null || _a === void 0 ? void 0 : _a.children[this.index + 1];
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Node.prototype, "prevSiblings", {
        get: function () {
            var _a, _b;
            return (_b = (_a = this.parent) === null || _a === void 0 ? void 0 : _a.children.slice(0, this.index)) !== null && _b !== void 0 ? _b : [];
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Node.prototype, "nextSiblings", {
        get: function () {
            var _a, _b;
            return (_b = (_a = this.parent) === null || _a === void 0 ? void 0 : _a.children.slice(this.index + 1)) !== null && _b !== void 0 ? _b : [];
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Node.prototype, "closestBlock", {
        get: function () {
            return this.closest(function (n) { return n.isBlock; });
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Node.prototype, "chain", {
        get: function () {
            var chain = [];
            var node = this;
            while (node) {
                chain.push(node);
                node = node.parent;
            }
            return chain;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Node.prototype, "parents", {
        get: function () {
            return this.chain.slice(1);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Node.prototype, "depth", {
        // root node has depth zero
        get: function () {
            var depth = 0;
            var node = this;
            while (node === null || node === void 0 ? void 0 : node.parent) {
                node = node.parent;
                depth += 1;
            }
            return depth;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Node.prototype, "isEmpty", {
        get: function () {
            if (this.isInlineAtom)
                return false;
            if (this.isInline)
                return !this.textContent;
            return this.children.every(function (n) { return n.isEmpty; });
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Node.prototype, "isVoid", {
        get: function () {
            return this.content.size === 0;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Node.prototype, "isInlineAtom", {
        get: function () {
            return this.isAtom && this.isInline;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Node.prototype, "isBlockAtom", {
        get: function () {
            return this.isBlock && this.isAtom;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Node.prototype, "index", {
        get: function () {
            var _this = this;
            var _a = (this.parent || {}).children, children = _a === void 0 ? [] : _a;
            return lodash_1.findIndex(children, function (n) {
                return _this.id.comp(n.id) === 0;
            });
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Node.prototype, "textContent", {
        get: function () {
            return this.content.textContent;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Node.prototype, "isRoot", {
        get: function () {
            return !this.parent;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Node.prototype, "isInline", {
        get: function () {
            return this.type.isInline;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Node.prototype, "isLeaf", {
        get: function () {
            return this.children.length === 0;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Node.prototype, "isContainerBlock", {
        get: function () {
            return this.type.isBlock && !this.type.isTextBlock;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Node.prototype, "isBlock", {
        get: function () {
            return this.type.isBlock;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Node.prototype, "isIsolating", {
        get: function () {
            return this.type.isIsolating;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Node.prototype, "isCollapsible", {
        get: function () {
            return this.type.isCollapsible;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Node.prototype, "groups", {
        get: function () {
            return this.type.groupsNames;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Node.prototype, "isText", {
        get: function () {
            return this.type.isText;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Node.prototype, "offset", {
        get: function () {
            return this.prevSiblings.reduce(function (offset, s) { return offset + s.size; }, 0);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Node.prototype, "nextMatchType", {
        get: function () {
            var _this = this;
            var _a, _b, _c;
            var fragment = Fragment_1.Fragment.from(array_1.takeUpto((_b = (_a = this.parent) === null || _a === void 0 ? void 0 : _a.children) !== null && _b !== void 0 ? _b : [], function (n) { return n === _this; }));
            console.log(fragment);
            return (_c = this.parent) === null || _c === void 0 ? void 0 : _c.type.contentMatch.matchFragment(fragment);
        },
        enumerable: false,
        configurable: true
    });
    //
    Node.prototype.setParent = function (parent) {
        this.parent = parent;
    };
    Node.prototype.closest = function (fn) {
        return this.chain.find(fn);
    };
    Node.prototype.sizeOf = function (fn) {
        return this.descendants(fn).reduce(function (s, n) { return s + n.size; }, 0);
    };
    // return true if `this` Node is after `other` Node
    Node.prototype.after = function (other) {
        if (this.eq(other)) {
            return false;
        }
        var selfParents = lodash_1.reverse(this.chain);
        var nodeParents = lodash_1.reverse(other.chain);
        // console.log(selfParents.map(n => `${n.id.key}:${n.index}`));
        // console.log(nodeParents.map(n => `${n.id.key}:${n.index}`));
        var depth = Math.min(selfParents.length, nodeParents.length);
        for (var i = 0; i < depth; i += 1) {
            if (!selfParents[i].eq(nodeParents[i])) {
                // console.log(selfParents[i].name, nodeParents[i].name, selfParents[i].index, nodeParents[i].index);
                return selfParents[i].index > nodeParents[i].index;
            }
        }
        // console.log((selfParents.length, nodeParents.length));
        // return (selfParents.length > nodeParents.length)
        return false;
    };
    Node.prototype.before = function (node) {
        if (this.eq(node)) {
            return false;
        }
        return !this.after(node);
    };
    Node.prototype.child = function (index) {
        return this.children[index];
    };
    Node.prototype.childAfter = function (pos) { };
    Node.prototype.childBefore = function (pos) { };
    Node.prototype.commonNode = function (node) {
        if (this.eq(node)) {
            return this;
        }
        var selfParents = lodash_1.reverse(this.chain);
        var nodeParents = lodash_1.reverse(node.chain);
        var parent = selfParents[0];
        for (var i = 0; i < selfParents.length; i += 1) {
            if (selfParents[i] !== nodeParents[i]) {
                break;
            }
            parent = selfParents[i];
        }
        return parent;
    };
    Node.prototype.comply = function (fn) {
        return false;
    };
    Node.prototype.cut = function (from, to) {
        // const nodes = this.slice(from, to);
        // this.content = [
        // 	...this.children.slice(0, from),
        // 	...this.children.slice(to),
        // ];
        // if (isString(nodes)) {
        // 	return [];
        // }
        return [];
    };
    Node.prototype.forAll = function (fn) {
        this.preorder(function (n) {
            fn(n);
            return false;
        });
    };
    Node.prototype.filterAll = function (fn) {
        var nodes = [];
        this.preorder(function (n) {
            if (fn(n)) {
                nodes.push(n);
            }
            return false;
        });
        return nodes;
    };
    Node.prototype.each = function (fn, opts) {
        if (opts === void 0) { opts = {}; }
        var _a = opts.direction, direction = _a === void 0 ? 'forward' : _a;
        if (direction === 'forward') {
            this.children.forEach(function (c) { return fn(c); });
        }
        else {
            this.children.slice().reverse().forEach(function (c) { return fn(c); });
        }
    };
    Node.prototype.find = function (fn, opts) {
        var found = null;
        opts = lodash_1.merge({ order: 'pre', direction: 'forward', skip: lodash_1.noop }, opts);
        // eslint-disable-next-line no-return-assign
        var collect = function (node) { return !!(fn(node) && (found = node)); };
        opts.order === 'pre' ? this.preorder(collect, opts) : this.postorder(collect, opts);
        return found;
    };
    // NOTE: the parent chain is not searched for the next node
    Node.prototype.prev = function (fn, opts, gotoParent) {
        var _a;
        if (fn === void 0) { fn = types_1.yes; }
        if (opts === void 0) { opts = {}; }
        if (gotoParent === void 0) { gotoParent = true; }
        var options = lodash_1.merge({ order: 'post', direction: 'backward', skip: lodash_1.noop }, opts);
        var sibling = this.prevSibling;
        var found = null;
        var collect = function (node) { return !!(fn(node) && (found = node)); };
        if (sibling && !options.skip(sibling)) {
            (options.order == 'pre' ? sibling === null || sibling === void 0 ? void 0 : sibling.preorder(collect, options) : sibling === null || sibling === void 0 ? void 0 : sibling.postorder(collect, options));
        }
        return (found
            || (sibling === null || sibling === void 0 ? void 0 : sibling.prev(fn, options, false))
            || (gotoParent ? (_a = this.parent) === null || _a === void 0 ? void 0 : _a.prev(fn, options, gotoParent) : null));
    };
    // NOTE: the parent chain is not searched for the next node
    // check if next siblings' tree can fulfill predicate
    // otherwise try parent next
    Node.prototype.next = function (fn, opts, gotoParent) {
        var _a;
        if (fn === void 0) { fn = types_1.yes; }
        if (opts === void 0) { opts = {}; }
        if (gotoParent === void 0) { gotoParent = true; }
        var options = lodash_1.merge({ order: 'post', direction: 'forward', skip: lodash_1.noop }, opts);
        var sibling = this.nextSibling;
        var found = null;
        var collect = function (node) { return !!(fn(node) && (found = node)); };
        if (sibling && !options.skip(sibling)) {
            (options.order == 'pre' ? sibling === null || sibling === void 0 ? void 0 : sibling.preorder(collect, options) : sibling === null || sibling === void 0 ? void 0 : sibling.postorder(collect, options));
        }
        return (found
            || (sibling === null || sibling === void 0 ? void 0 : sibling.next(fn, options, false))
            // || (lastChild && this.parent && fn(this.parent) ? this.parent : null)
            || (gotoParent ? (_a = this.parent) === null || _a === void 0 ? void 0 : _a.next(fn, options, gotoParent) : null));
    };
    // walk preorder, traverse order: node -> children -> ...
    Node.prototype.walk = function (fn, opts) {
        if (fn === void 0) { fn = types_1.yes; }
        if (opts === void 0) { opts = {}; }
        var _a = opts.order, order = _a === void 0 ? 'pre' : _a, _b = opts.direction, direction = _b === void 0 ? 'forward' : _b;
        var done = order == 'pre' ? this.preorder(fn, opts) : this.postorder(fn, opts);
        // without the () brackets this will be wrong
        return done || (direction === 'forward' ? !!this.next(fn, opts) : !!this.prev(fn, opts));
    };
    Node.prototype.preorder = function (fn, opts) {
        if (fn === void 0) { fn = types_1.yes; }
        if (opts === void 0) { opts = {}; }
        var _a = opts.direction, direction = _a === void 0 ? 'forward' : _a;
        var children = this.children;
        return direction === 'forward'
            ? fn(this) || children.some(function (n) { return n.preorder(fn, opts); })
            : fn(this) || children.slice().reverse().some(function (ch) { return ch.preorder(fn, opts); });
    };
    Node.prototype.postorder = function (fn, opts) {
        if (opts === void 0) { opts = {}; }
        var _a = opts.direction, direction = _a === void 0 ? 'forward' : _a;
        var children = this.children;
        return direction === 'forward'
            ? children.some(function (n) { return n.postorder(fn, opts); }) || fn(this)
            : children.slice().reverse().some(function (ch) { return ch.postorder(fn, opts); }) || fn(this);
    };
    Node.prototype.descendants = function (fn, opts) {
        if (fn === void 0) { fn = types_1.yes; }
        var nodes = [];
        var collect = function (node) { return !!(fn(node) && nodes.push(node)); };
        this.each(function (child) { return child.preorder(function (node) { return collect(node); }, opts); });
        return nodes;
    };
    Node.prototype.replace = function (node, fragment) {
        this.content = this.content.replace(node, fragment).withParent(this);
        this.markUpdated();
    };
    // @mutates
    Node.prototype.append = function (fragment) {
        this.content = this.content.append(fragment).withParent(this);
        this.markUpdated();
    };
    // @mutates
    Node.prototype.insertBefore = function (fragment, node) {
        this.content = this.content.insertBefore(fragment, node).withParent(this);
        this.markUpdated();
    };
    // @mutates
    Node.prototype.insertAfter = function (fragment, node) {
        this.content = this.content.insertAfter(fragment, node).withParent(this);
        this.markUpdated();
    };
    // @mutates
    Node.prototype.remove = function (node) {
        this.content.remove(node);
        this.markUpdated();
        // console.log('removed', this.root?.version, this.root?.name, this.root?.test_key, this.root?.updatedChildren)
    };
    Node.prototype.updateText = function (text) {
        this.content.updateText(text);
        this.markUpdated();
    };
    Node.prototype.updateContent = function (content) {
        this.content = content.withParent(this);
        this.markUpdated();
    };
    // @mutates
    Node.prototype.changeType = function (type) {
        this.type = type;
        this.attrs = new NodeAttrs_1.NodeAttrs({
            html: __assign(__assign({}, this.attrs.html), type.attrs.html),
            node: __assign(__assign({}, this.attrs.node), type.attrs.node)
        });
        this.markUpdated();
    };
    // @mutates
    Node.prototype.updateAttrs = function (props) {
        this.attrs = this.attrs.update(props);
        this.markUpdated();
    };
    // @mutates
    Node.prototype.updateData = function (data) {
        this.data.update(data);
        this.markUpdated();
    };
    // @mutates
    Node.prototype.addMark = function (mark, start, end) {
        // this.marks?.add(mark);
        // this.markUpdated();
    };
    // @mutates
    Node.prototype.removeMark = function (mark, start, end) {
        // this.markUpdated();
        // this.marks?.remove(mark);
    };
    Node.prototype.markUpdated = function () {
        this.chain.forEach(function (n) {
            n.updateVersion++;
        });
    };
    Node.prototype.eq = function (node) {
        return this.id.eq(node.id);
    };
    Node.prototype.toString = function () {
        return Logger_1.classString(this)({
            id: this.id,
            name: this.name
        });
    };
    Node.prototype.toJSON = function () {
        var _a = this, id = _a.id, type = _a.type, content = _a.content;
        return __assign({ id: id.toString(), name: type.name }, content.toJSON());
    };
    Node.prototype.viewJSON = function () {
        var _a = this, id = _a.id, type = _a.type, data = _a.data, attrs = _a.attrs, textContent = _a.textContent;
        return {
            id: id,
            type: type,
            data: data,
            attrs: attrs,
            children: this.children.map(function (n) { return n.viewJSON(); }),
            text: this.isText ? this.textContent : ''
        };
    };
    Node.prototype.clone = function () {
        var _a = this, id = _a.id, type = _a.type, content = _a.content, attrs = _a.attrs, data = _a.data, marks = _a.marks, renderVersion = _a.renderVersion, updateVersion = _a.updateVersion;
        var cloned = Node.create({
            id: id,
            type: type,
            content: content.clone(),
            attrs: attrs,
            data: data,
            marks: marks,
            renderVersion: renderVersion,
            updateVersion: updateVersion
        });
        cloned.setParent(this.parent);
        return cloned;
    };
    // view act as a immutable node tree reference
    Node.prototype.view = function (container) {
        if (container === void 0) { container = []; }
        return this;
    };
    return Node;
}(events_1.EventEmitter));
exports.Node = Node;
function NodeComparator(a, b) {
    return b.id.comp(a.id);
}
exports.NodeComparator = NodeComparator;
