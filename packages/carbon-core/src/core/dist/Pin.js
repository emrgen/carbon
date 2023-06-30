"use strict";
exports.__esModule = true;
exports.Pin = void 0;
var Logger_1 = require("./Logger");
var Point_1 = require("./Point");
var constrain_1 = require("../utils/constrain");
var PinReference;
(function (PinReference) {
    PinReference["front"] = "front";
    PinReference["back"] = "back";
})(PinReference || (PinReference = {}));
// materialized pin is a pin that is not a reference to a i
var Pin = /** @class */ (function () {
    function Pin(node, offset, ref) {
        if (ref === void 0) { ref = PinReference.front; }
        this.node = node;
        this.offset = offset;
        this.ref = ref;
    }
    Object.defineProperty(Pin.prototype, "isInvalid", {
        get: function () {
            return this.offset === -10;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Pin.prototype, "point", {
        get: function () {
            return Point_1.Point.toWithin(this.node.id, this.offset);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Pin.prototype, "isAtStart", {
        get: function () {
            return this.offset === 0;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Pin.prototype, "isAtEnd", {
        get: function () {
            return this.offset === this.node.focusSize;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Pin.prototype, "isBefore", {
        get: function () {
            if (this.node.isEmpty)
                return false;
            return !this.node.isEmpty && this.offset === 0;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Pin.prototype, "isWithin", {
        get: function () {
            if (this.node.isEmpty)
                return true;
            return 0 < this.offset && this.offset < this.node.focusSize;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Pin.prototype, "isAfter", {
        get: function () {
            if (this.node.isEmpty)
                return false;
            return this.offset === this.node.focusSize;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Pin.prototype, "leftAlign", {
        get: function () {
            var prevSibling = this.node.prevSibling;
            if (!this.node.isEmpty && this.offset === 0 && (prevSibling === null || prevSibling === void 0 ? void 0 : prevSibling.isFocusable)) {
                return Pin.create(prevSibling, prevSibling.focusSize);
            }
            else {
                return this;
            }
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Pin.prototype, "rightAlign", {
        //
        get: function () {
            var nextSibling = this.node.nextSibling;
            if (!this.node.isEmpty && this.offset === this.node.focusSize && (nextSibling === null || nextSibling === void 0 ? void 0 : nextSibling.isFocusable)) {
                return Pin.create(nextSibling, 0);
            }
            else {
                return this;
            }
        },
        enumerable: false,
        configurable: true
    });
    Pin["default"] = function (node) {
        return new Pin(node, -10);
    };
    Pin.fromPoint = function (point, store) {
        if (!point.isWithin)
            return;
        var node = store.get(point.nodeId);
        if (!node || !node.type.isTextBlock) {
            console.warn('Pin.fromPoint: invalid node', point.toString(), node === null || node === void 0 ? void 0 : node.toString());
            return;
        }
        var offset = point.offset;
        if (node.focusSize < offset) {
            console.warn('Pin.fromPoint: invalid offset', node.toString(), offset, point.toString());
            return;
        }
        return Pin.create(node, offset);
    };
    Pin.fromDom = function (node, offset) {
        if (!node.isFocusable) {
            if (offset === 0) {
                node = node.find(function (n) { return n.isFocusable; });
                if (!node)
                    return;
            }
            else {
                return;
            }
        }
        var pin = Pin.toStartOf(node);
        if (node.isEmpty) {
            return pin;
        }
        return pin === null || pin === void 0 ? void 0 : pin.moveBy(offset);
    };
    Pin.toStartOf = function (node) {
        if (node.isEmpty || node.isAtom) {
            return Pin.create(node.find(function (n) { return n.isLeaf; }), 0);
        }
        var target = node.find(function (n) { return n.isFocusable; }, { order: 'post' });
        if (!target)
            return null;
        return Pin.create(target, 0).up();
    };
    Pin.toEndOf = function (node) {
        if (node.isEmpty) {
            var target = node.find(function (n) { return n.isFocusable; }, { order: 'post', direction: 'backward' });
            if (!target)
                return null;
            return Pin.create(target, 0);
        }
        var child = node.find(function (n) { return n.isFocusable || n.hasFocusable; }, { order: 'post', direction: 'backward' });
        if (!child)
            return null;
        if (child.isEmpty) {
            return Pin.create(child, 0);
        }
        return Pin.create(child, child.focusSize).up();
    };
    Pin.create = function (node, offset) {
        if (!node.isFocusable && !node.hasFocusable) {
            console.log('create pin', node.name, offset, node);
            throw new Error("node is not focusable: " + node.name);
        }
        if (node.focusSize < offset) {
            throw new Error("node: " + node.name + " does not have the provided offset: " + offset);
        }
        return new Pin(node, offset);
    };
    //
    Pin.future = function (node, offset, ref) {
        if (ref === void 0) { ref = PinReference.front; }
        return new Pin(node, offset, ref);
    };
    // lift pin to the parent
    Pin.prototype.up = function () {
        var _a = this, node = _a.node, offset = _a.offset;
        if (node.isBlock)
            return this;
        var parent = node.parent;
        if (!parent) {
            return;
        }
        var distance = 0;
        parent === null || parent === void 0 ? void 0 : parent.children.some(function (n) {
            if (n.eq(node)) {
                distance += offset;
                return true;
            }
            distance += n.focusSize;
            return false;
        });
        return Pin.create(parent, distance);
    };
    // push pin down to the proper child
    Pin.prototype.down = function () {
        var _a = this, node = _a.node, offset = _a.offset;
        if (offset === 0 && node.isEmpty || node.isInline) {
            return this.clone();
        }
        var distance = offset;
        var pin;
        node === null || node === void 0 ? void 0 : node.children.some(function (n) {
            if (distance <= n.focusSize) {
                pin = Pin.create(n, distance);
                return true;
            }
            distance -= n.focusSize;
            return false;
        });
        return pin;
    };
    // check if pin is before the provided pin
    Pin.prototype.isBeforeOf = function (of) {
        if (this.node.eq(of.node)) {
            return this.offset < of.offset;
        }
        return this.node.before(of.node);
    };
    // check if pin is after the provided pin
    Pin.prototype.isAfterOf = function (of) {
        if (this.node.eq(of.node)) {
            return this.offset > of.offset;
        }
        return this.node.after(of.node);
    };
    // check if pin is at the start of the provided node
    Pin.prototype.isAtStartOfNode = function (node) {
        var first = node.find(function (n) { return n.hasFocusable; }, { order: 'post' });
        if (!first)
            return false;
        // console.log(first.toString(), this.toString());
        return Pin.create(first, 0).eq(this);
    };
    // check if pin is at the end of the provide node
    Pin.prototype.isAtEndOfNode = function (node) {
        var last = node.find(function (n) { return n.hasFocusable; }, { direction: 'backward', order: 'post' });
        if (!last)
            return false;
        return Pin.create(last, last.focusSize).eq(this);
    };
    // move the pin to the start of next matching node
    Pin.prototype.moveToStartOfNext = function (fn) {
        var next = this.node.next(fn);
        if (!next || !next.isSelectable)
            return null;
        return Pin.create(next, 0);
    };
    // move the pin to the start of prev matching node
    Pin.prototype.moveToEndOfPrev = function (fn) {
        var prev = this.node.prev(fn);
        if (!prev || !prev.isSelectable)
            return null;
        return Pin.create(prev, prev.focusSize);
    };
    // move the pin by distance through focusable nodes
    Pin.prototype.moveBy = function (distance) {
        var _a, _b;
        var down = this.down();
        return distance >= 0 ? (_a = down === null || down === void 0 ? void 0 : down.moveForwardBy(distance)) === null || _a === void 0 ? void 0 : _a.up() : (_b = down === null || down === void 0 ? void 0 : down.moveBackwardBy(-distance)) === null || _b === void 0 ? void 0 : _b.up();
    };
    // each step can be considered as one right key press
    // tries to move as much as possible
    Pin.prototype.moveForwardBy = function (distance) {
        // console.log('Pin.moveForwardBy', this.toString(),distance);
        if (distance === 0) {
            return this.clone();
        }
        var _a = this, node = _a.node, offset = _a.offset;
        distance = offset + distance; //+ (node.isEmpty ? 1 : 0);
        var prev = node;
        var curr = node;
        var currSize = 0;
        // console.log(node.id);
        // console.log('start pos', curr.id.toString(), offset, distance);
        while (prev && curr) {
            if (!prev.closestBlock.eq(curr.closestBlock)) {
                distance -= 1;
            }
            // console.log('=>',curr.id.toString(), curr.size, distance);
            currSize = curr.focusSize;
            // console.log(focusSize, curr.id, curr.name);
            if (distance <= currSize) {
                // console.log(curr.id, curr.focusSize, offset);
                break;
            }
            // if curr is Empty it will have -
            distance -= currSize;
            // console.log(curr.id.key, curr.focusSize);
            prev = curr;
            curr = curr.next(function (n) { return n.isFocusable; }, {
                skip: function (n) { return n.isIsolating; }
            });
        }
        if (!curr) {
            return Pin.create(prev, prev.size);
        }
        distance = constrain_1.constrain(distance, 0, curr.focusSize);
        return Pin.create(curr, distance);
    };
    // each step can be considered as one left key press
    Pin.prototype.moveBackwardBy = function (distance) {
        if (distance === 0) {
            return this.clone();
        }
        var _a = this, node = _a.node, offset = _a.offset;
        distance = node.size - offset + distance;
        var prev = node;
        var curr = node;
        var currSize = 0;
        while (prev && curr) {
            if (!prev.closestBlock.eq(curr.closestBlock)) {
                distance -= 1;
            }
            // console.log('=>', curr.id.toString(), curr.size, distance);
            currSize = curr.focusSize;
            // console.log(focusSize, curr.id, curr.name);
            if (distance <= currSize) {
                // console.log(curr.id, curr.focusSize, offset);
                break;
            }
            // if curr is Empty it will have -
            distance -= currSize;
            // console.log(curr.id.key, curr.focusSize);
            prev = curr;
            curr = curr.prev(function (n) { return n.isFocusable; }, {
                skip: function (n) { return n.isIsolating; }
            });
        }
        // console.log(curr?.id.toString(), prev.id.toString(), curr?.size, distance);
        console.log('xxx', prev);
        if (!curr) {
            return Pin.create(prev, 0);
        }
        distance = constrain_1.constrain(curr.focusSize - distance, 0, curr.focusSize);
        return Pin.create(curr, distance);
    };
    Pin.prototype.map = function (fn) {
        return fn(this);
    };
    Pin.prototype.eq = function (other) {
        return this.node.eq(other.node) && this.offset === other.offset;
    };
    Pin.prototype.clone = function () {
        return new Pin(this.node, this.offset);
    };
    Pin.prototype.toJSON = function () {
        return { id: this.node.id.toJSON(), offset: this.offset };
    };
    Pin.prototype.toString = function () {
        var _a = this, node = _a.node, offset = _a.offset;
        return Logger_1.classString(this)(node.id.toString() + "/" + offset);
    };
    return Pin;
}());
exports.Pin = Pin;
