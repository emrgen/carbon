"use strict";
exports.__esModule = true;
exports.RemoveText = void 0;
var Result_1 = require("./Result");
var types_1 = require("./types");
var utils_1 = require("./utils");
var InsertText_1 = require("./InsertText");
var Logger_1 = require("../Logger");
var Pin_1 = require("../Pin");
// action to remove text from a node
var RemoveText = /** @class */ (function () {
    function RemoveText(at, node, origin) {
        this.at = at;
        this.node = node;
        this.origin = origin;
        this.id = utils_1.generateActionId();
        this.type = types_1.ActionType.insertText;
    }
    RemoveText.create = function (at, node, origin) {
        if (origin === void 0) { origin = types_1.ActionOrigin.UserInput; }
        return new RemoveText(at, node, origin);
    };
    RemoveText.prototype.execute = function (tr) {
        var _a;
        var _b = this, at = _b.at, node = _b.node;
        var app = tr.app;
        var pin = Pin_1.Pin.fromPoint(at, app.store);
        if (!pin) {
            return Result_1.ActionResult.withError('failed to get delete pin');
        }
        var _c = pin.down().rightAlign, target = _c.node, offset = _c.offset;
        console.log('REMOVE NODE', at.toString(), target.id.toString(), target.textContent, offset, node.textContent);
        var textContent = target.textContent;
        var updatedTextContent = textContent.slice(0, offset) + textContent.slice(offset + node.textContent.length);
        // if the text updated content is empty, remove the node
        // TODO: reimplement this using better logic
        if (updatedTextContent === '') {
            (_a = target.parent) === null || _a === void 0 ? void 0 : _a.remove(target);
            tr.updated(target.parent);
            return Result_1.NULL_ACTION_RESULT;
        }
        target.updateText(updatedTextContent);
        tr.updated(target);
        tr.updated(target.parent);
        console.log('removing text...', offset, pin.offset);
        console.log('updated text', target.version, textContent, updatedTextContent, target);
        return Result_1.ActionResult.withValue('done');
    };
    RemoveText.prototype.inverse = function () {
        var _a = this, at = _a.at, node = _a.node, origin = _a.origin;
        return InsertText_1.InsertText.create(at, node, false, origin);
    };
    RemoveText.prototype.toString = function () {
        var _a = this, at = _a.at, node = _a.node, origin = _a.origin;
        return Logger_1.classString(this)({
            at: at.toString(),
            node: node,
            origin: origin
        });
    };
    return RemoveText;
}());
exports.RemoveText = RemoveText;
