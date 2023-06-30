"use strict";
exports.__esModule = true;
exports.InsertText = void 0;
var types_1 = require("./types");
var utils_1 = require("./utils");
var RemoveText_1 = require("./RemoveText");
var Result_1 = require("./Result");
var Logger_1 = require("../Logger");
var Pin_1 = require("../Pin");
var Fragment_1 = require("../Fragment");
var lodash_1 = require("lodash");
var InsertText = /** @class */ (function () {
    function InsertText(at, text, native, origin) {
        this.at = at;
        this.text = text;
        this.native = native;
        this.origin = origin;
        this.id = utils_1.generateActionId();
        this.type = types_1.ActionType.insertText;
    }
    InsertText.create = function (at, text, native, origin) {
        return new InsertText(at, text, native, origin);
    };
    InsertText.prototype.execute = function (tr) {
        var _a, _b, _c;
        var _d = this, at = _d.at, text = _d.text, native = _d.native;
        var app = tr.app;
        var schema = app.schema;
        var pin = (_a = Pin_1.Pin.fromPoint(at, tr.app.store)) === null || _a === void 0 ? void 0 : _a.down();
        if (!pin) {
            return Result_1.ActionResult.withError('failed to find pin from: ' + at.toString());
        }
        var node = pin.node, offset = pin.offset;
        var parent = node.parent;
        var fragment = Fragment_1.Fragment.fromNode(text);
        if (!parent) {
            return Result_1.ActionResult.withError('failed to find pin from: ' + at.toString());
        }
        console.log('inserting text', this.text);
        console.log('xxxxxxxxxxxxxxx', pin, pin.isBefore, pin.isAfter, pin.isWithin);
        if (pin.isBefore) {
            var textContent = node.textContent;
            // if the current text style match just insert into existing text
            if (lodash_1.isEqual(node.attrs, text.attrs)) {
                node.updateText(text.textContent + textContent);
                if (!native) {
                    tr.updated(node);
                }
            }
            else {
                (_b = node.parent) === null || _b === void 0 ? void 0 : _b.insertAfter(Fragment_1.Fragment.fromNode(text), node);
                tr.updated(node.parent);
            }
            return Result_1.ActionResult.withValue('done');
        }
        if (pin.isAfter) {
            var textContent = node.textContent;
            // if the current text style match just insert into existing text
            if (lodash_1.isEqual(node.attrs, text.attrs)) {
                node.updateText(textContent + text.textContent);
                if (!native) {
                    tr.updated(node);
                }
            }
            else {
                (_c = node.parent) === null || _c === void 0 ? void 0 : _c.insertAfter(Fragment_1.Fragment.fromNode(text), node);
                tr.updated(node.parent);
            }
            return Result_1.ActionResult.withValue('done');
        }
        if (pin.isWithin) {
            if (node.isBlock) {
                node.append(fragment);
                if (!native) {
                    tr.updated(node);
                }
            }
            else {
                var textContent = node.textContent;
                // if the current text style match just insert into existing text
                var updatedText = textContent.slice(0, offset) + text.textContent + textContent.slice(offset);
                node.updateText(updatedText);
                if (!native) {
                    tr.updated(node);
                }
            }
            return Result_1.ActionResult.withValue('done');
        }
        return Result_1.ActionResult.withValue('done');
    };
    InsertText.prototype.inverse = function () {
        var _a = this, at = _a.at, text = _a.text, origin = _a.origin;
        return RemoveText_1.RemoveText.create(at, text, origin);
    };
    InsertText.prototype.toString = function () {
        var _a = this, at = _a.at, text = _a.text, origin = _a.origin;
        return Logger_1.classString(this)({
            at: at.toString(),
            text: text,
            origin: origin
        });
    };
    return InsertText;
}());
exports.InsertText = InsertText;
