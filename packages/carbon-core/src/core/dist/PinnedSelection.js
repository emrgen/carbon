"use strict";
exports.__esModule = true;
exports.PinnedSelection = void 0;
var Logger_1 = require("./Logger");
var Pin_1 = require("./Pin");
var PointedSelection_1 = require("./PointedSelection");
var Range_1 = require("./Range");
var PinnedSelection = /** @class */ (function () {
    function PinnedSelection(tail, head) {
        this.tail = tail;
        this.head = head;
    }
    PinnedSelection.fromDom = function (store) {
        var _a, _b, _c;
        var domSelection = window.getSelection();
        // console.log(domSelection);
        if (!domSelection) {
            console.warn(Logger_1.p14('%c[error]'), 'color:red', 'window selection is EMPTY');
            return null;
        }
        var anchorEl = domSelection.anchorNode, anchorOffset = domSelection.anchorOffset, focusEl = domSelection.focusNode, focusOffset = domSelection.focusOffset;
        // console.log(p14('%c[info]'), 'color:pink', p30('Selection.fromDom'), anchorEl, focusEl, anchorOffset, focusOffset);
        var anchorNode = store.resolve(anchorEl);
        var focusNode = store.resolve(focusEl);
        // console.log(anchorEl, anchorNode, anchorOffset);
        // console.log(anchorNode);
        // console.log(focusNode);
        if (!focusNode || !anchorNode) {
            console.warn(Logger_1.p14('%c[error]'), 'color:red', 'Editor.resolveNode failed');
            return;
        }
        // console.log(anchorNode, anchorNode.isFocusable)
        // NOTE: anchorNode is always valid
        if (!anchorNode.hasFocusable && !anchorNode.isFocusable) {
            console.warn(Logger_1.p14('%c[info]'), 'color:pink', 'anchorNode skips focus', anchorNode.name, focusNode.name);
            if (anchorNode.after(focusNode)) {
                anchorNode = anchorNode.prev(function (n) { return n.isFocusable; });
                if (anchorNode) {
                    anchorOffset = anchorNode.size;
                }
                else {
                    console.error('should not reach here');
                }
            }
            else {
                anchorNode = anchorNode.next(function (n) { return n.isFocusable; });
                if (focusNode) {
                    anchorOffset = (_a = anchorNode === null || anchorNode === void 0 ? void 0 : anchorNode.focusSize) !== null && _a !== void 0 ? _a : 0;
                }
                else {
                    console.error('should not reach here');
                }
            }
        }
        if (!anchorNode) {
            console.error(Logger_1.p14('%c[error]'), 'color:red', 'anchorNode not found');
            return null;
        }
        // NOTE: keep the focusNode on valid focusable node
        if (!focusNode.hasFocusable && !focusNode.isFocusable) {
            console.warn(Logger_1.p14('%c[info]'), 'color:pink', 'focusNode skips focus', anchorNode.name, focusNode.name);
            // if focusNode is not focusable, then find focusable node that is closest to anchorNode
            if (focusNode.after(anchorNode)) {
                focusNode = focusNode.prev(function (n) { return n.isFocusable; });
                if (focusNode) {
                    focusOffset = focusNode.size;
                }
                else {
                    console.error('should not reach here');
                }
            }
            else {
                focusNode = focusNode.next(function (n) { return n.isFocusable; });
                if (focusNode) {
                    focusOffset = 0;
                }
                else {
                    console.error('should not reach here');
                }
            }
        }
        // console.info(p14('%c[info]'), 'color:pink', p30('fromDom:beforeOffsetModify'), anchorNode.id.toString(), focusNode.id.toString(), anchorOffset, focusOffset);
        // if (anchorNode.isAtom) { anchorOffset = constrain(anchorOffset, 0, 1) }
        // if (focusNode.isAtom) { focusOffset = constrain(focusOffset, 0, 1) }
        var tail = (_b = Pin_1.Pin.fromDom(anchorNode, anchorOffset)) === null || _b === void 0 ? void 0 : _b.up();
        var head = (_c = Pin_1.Pin.fromDom(focusNode, focusOffset)) === null || _c === void 0 ? void 0 : _c.up();
        // console.log(tail?.toString(), head?.toString());
        if (!tail || !head) {
            console.warn(Logger_1.p14('%c[error]'), 'color:red', 'Pin.fromDom failed');
            return;
        }
        // console.info(p14('%c[info]'), 'color:pink', p30('fromDom:afterOffsetModify'), anchorNode.id.toString(), focusNode.id.toString(), anchorOffset, focusOffset);
        var selection = PinnedSelection.create(tail, head);
        // console.log(p14('%c[info]'), 'color:pink', p30('fromDom:Selection'), selection.toString());
        return selection;
    };
    PinnedSelection["default"] = function (doc) {
        var pin = Pin_1.Pin["default"](doc);
        return PinnedSelection.create(pin, pin);
    };
    PinnedSelection.fromPin = function (pin) {
        return PinnedSelection.create(pin, pin);
    };
    PinnedSelection.create = function (tail, head) {
        return new PinnedSelection(tail, head);
    };
    Object.defineProperty(PinnedSelection.prototype, "range", {
        get: function () {
            return Range_1.Range.create(this.start, this.end);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(PinnedSelection.prototype, "isInvalid", {
        get: function () {
            return this.tail.isInvalid || this.head.isInvalid;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(PinnedSelection.prototype, "isCollapsed", {
        get: function () {
            return this.tail.eq(this.head);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(PinnedSelection.prototype, "start", {
        get: function () {
            return this.isForward ? this.tail : this.head;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(PinnedSelection.prototype, "end", {
        get: function () {
            return this.isForward ? this.head : this.tail;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(PinnedSelection.prototype, "isBackward", {
        get: function () {
            return !this.isForward;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(PinnedSelection.prototype, "isForward", {
        get: function () {
            var _a = this, tail = _a.tail, head = _a.head;
            return head.isAfterOf(tail);
        },
        enumerable: false,
        configurable: true
    });
    PinnedSelection.prototype.syncDom = function (store) {
        var _a;
        try {
            var domSelection = this.intoDomSelection(store);
            console.log(domSelection);
            if (!domSelection) {
                console.log(Logger_1.p14('%c[error]'), 'color:red', 'failed to map selection to dom');
                return;
            }
            var anchorNode = domSelection.anchorNode, anchorOffset = domSelection.anchorOffset, focusNode = domSelection.focusNode, focusOffset = domSelection.focusOffset;
            // let node = anchorNode
            // while (node = node?.parentElement) {
            // 	console.log(node)
            // }
            // console.log(p14('%c[info]'), 'color:pink', p30('selection.setBaseAndExtent'), anchorNode, anchorOffset, focusNode, focusOffset);
            // Ref: https://stackoverflow.com/a/779785/4556425
            // https://github.com/duo-land/duo/blob/dev/packages/selection/src/plugins/SyncDomSelection.ts
            var selection = window.getSelection();
            selection === null || selection === void 0 ? void 0 : selection.setBaseAndExtent(anchorNode, anchorOffset, focusNode, focusOffset);
            var domSel = (_a = PinnedSelection.fromDom(store)) === null || _a === void 0 ? void 0 : _a.intoDomSelection(store);
            console.assert((domSel === null || domSel === void 0 ? void 0 : domSel.anchorNode) === domSelection.anchorNode, 'failed to sync anchorNode');
            console.assert((domSel === null || domSel === void 0 ? void 0 : domSel.focusNode) === domSelection.focusNode, 'failed to sync focusNode');
            console.assert((domSel === null || domSel === void 0 ? void 0 : domSel.anchorOffset) === domSelection.anchorOffset, 'failed to sync anchor offset');
            console.assert((domSel === null || domSel === void 0 ? void 0 : domSel.focusOffset) === domSelection.focusOffset, 'failed to sync focus offset');
            console.log('Selection.syncDom:', this.toString());
        }
        catch (err) {
            console.error(err);
        }
    };
    PinnedSelection.prototype.intoDomSelection = function (store) {
        var _a, _b;
        var _c = this, head = _c.head, tail = _c.tail;
        // console.log('Selection.intoDomSelection', range?.toString());
        // console.debug(p14('%c[DEBUG]'), 'color:magenta', p30('intoDomSelection'), range.toString());
        var focus = head.down();
        var anchor = tail.down();
        if (!focus || !anchor)
            return;
        var anchorNode = store.element(anchor.node.id);
        var focusNode = store.element(focus.node.id);
        // console.log(anchorNode, focusNode, anchor.node.id.toString(), focus.node.id.toString());
        if (!anchorNode || !focusNode) {
            console.log(Logger_1.p14('%c[error]'), 'color:red', 'anchor/focus not not found');
            return;
        }
        var tailOffset = anchor.offset;
        var headOffset = focus.offset;
        // console.log(headOffset, head.node.id.toString(), tail.isAtEnd);
        // console.log(tailOffset, headOffset);
        // if (tail.isAtEnd && tail.node.isAtom && tail.node.type.groupsNames.includes('emoji')) {
        // 	console.log('updating tail offset');
        // 	tailOffset = 11
        // }
        // if (head.isAtEnd && head.node.isAtom && head.node.type.groupsNames.includes('emoji')) {
        // 	console.log('updating head offset');
        // 	headOffset = 11
        // }
        // console.log('nativeSelection', anchorNode.id.toString(), anchorNode);
        // console.log(focusNode.firstChild?.firstChild ?? focusNode.firstChild ?? focusNode, headOffset);
        // console.log(anchorNode.firstChild?.firstChild ?? anchorNode.firstChild ?? anchorNode, tailOffset);
        if (tail.node.isBlock && tail.node.isAtom) {
            anchorNode = anchorNode;
        }
        else {
            anchorNode = (_a = anchorNode.firstChild) !== null && _a !== void 0 ? _a : anchorNode;
        }
        if (head.node.isBlock && head.node.isAtom) {
            focusNode = focusNode;
        }
        else {
            focusNode = (_b = focusNode.firstChild) !== null && _b !== void 0 ? _b : focusNode;
        }
        // find focusable dom nodes
        return {
            // NOTE: need to find focusable node. all HTML elements are not focusable
            // anchorNode: anchorNode.firstChild?.firstChild ?? anchorNode.firstChild ?? anchorNode,
            // focusNode: focusNode.firstChild?.firstChild ?? focusNode.firstChild ?? focusNode,
            anchorNode: anchorNode,
            focusNode: focusNode,
            anchorOffset: tailOffset,
            focusOffset: headOffset
        };
    };
    PinnedSelection.prototype.collapseToHead = function () {
        var head = this.head;
        return PinnedSelection.create(head, head);
    };
    PinnedSelection.prototype.collapseToTail = function () {
        var tail = this.tail;
        return PinnedSelection.create(tail, tail);
    };
    PinnedSelection.prototype.moveEnd = function (distance) {
        return this.isForward
            ? this.moveHead(distance)
            : this.moveTail(distance);
    };
    PinnedSelection.prototype.moveStart = function (distance) {
        return this.isBackward
            ? this.moveHead(distance)
            : this.moveTail(distance);
    };
    PinnedSelection.prototype.moveBy = function (distance) {
        var _a;
        return (_a = this.moveHead(distance)) === null || _a === void 0 ? void 0 : _a.moveTail(distance);
    };
    PinnedSelection.prototype.moveTail = function (distance) {
        var _a = this, tail = _a.tail, head = _a.head;
        var anchor = tail.moveBy(distance);
        if (!anchor || !tail)
            return;
        return PinnedSelection.create(anchor, head);
    };
    PinnedSelection.prototype.moveHead = function (distance) {
        var _a = this, tail = _a.tail, head = _a.head;
        var focus = head.moveBy(distance);
        if (!focus || !head)
            return;
        return PinnedSelection.create(tail, focus);
    };
    PinnedSelection.prototype.commonNode = function () {
        var _a = this, head = _a.head, tail = _a.tail;
        return head.node.commonNode(tail.node);
    };
    PinnedSelection.prototype.normalize = function () {
        var _a = this, head = _a.head, tail = _a.tail;
        if (this.isForward)
            return this;
        return PinnedSelection.create(head, tail);
    };
    PinnedSelection.prototype.collapseToStart = function () {
        return this.isForward
            ? this.collapseToTail()
            : this.collapseToHead();
    };
    PinnedSelection.prototype.collapseToEnd = function () {
        return this.isBackward
            ? this.collapseToTail()
            : this.collapseToHead();
    };
    PinnedSelection.prototype.unpin = function () {
        var _a = this, tail = _a.tail, head = _a.head;
        // console.log('Selection.unpin', tail.toString());
        return PointedSelection_1.PointedSelection.create(tail.point, head.point);
    };
    PinnedSelection.prototype.eq = function (other) {
        return this.tail.eq(other.tail) && this.head.eq(other.head);
    };
    PinnedSelection.prototype.clone = function () {
        return PinnedSelection.create(this.tail.clone(), this.head.clone());
    };
    PinnedSelection.prototype.toString = function () {
        return Logger_1.classString(this)({
            tail: this.tail.toString(),
            head: this.head.toString()
        });
    };
    return PinnedSelection;
}());
exports.PinnedSelection = PinnedSelection;
