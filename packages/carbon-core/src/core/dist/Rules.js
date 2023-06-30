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
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
exports.__esModule = true;
exports.PasteRule = exports.AfterInputRule = exports.AfterInputRuleHandler = exports.BeforeInputRuleHandler = exports.InputRule = exports.ChangeRules = void 0;
var ChangeRules = /** @class */ (function () {
    function ChangeRules() {
        var rules = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            rules[_i] = arguments[_i];
        }
        this.rules = rules;
    }
    ChangeRules.prototype.execute = function (ctx, text) {
        return this.rules.some(function (r) { return r.execute(ctx, text); });
    };
    ChangeRules.prototype.merge = function () {
        var rules = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            rules[_i] = arguments[_i];
        }
        return new (ChangeRules.bind.apply(ChangeRules, __spreadArrays([void 0, this], rules)))();
    };
    return ChangeRules;
}());
exports.ChangeRules = ChangeRules;
var InputRule = /** @class */ (function () {
    function InputRule(regex, handler) {
        this.regex = regex;
        this.handler = handler;
    }
    InputRule.prototype.execute = function (ctx, text) {
        console.info('[matching]', text, this.regex, this.regex.test(text));
        if (this.regex.test(text)) {
            this.handler(ctx, this.regex, text);
            return true;
        }
        return false;
    };
    InputRule.prototype.merge = function () {
        var rules = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            rules[_i] = arguments[_i];
        }
        return new (ChangeRules.bind.apply(ChangeRules, __spreadArrays([void 0, this], rules)))();
    };
    return InputRule;
}());
exports.InputRule = InputRule;
var BeforeInputRuleHandler = /** @class */ (function () {
    function BeforeInputRuleHandler(rules) {
        this.rules = rules;
    }
    // process the event based on modified node.textContent
    BeforeInputRuleHandler.prototype.process = function (ctx, node) {
        var event = ctx.event, app = ctx.app;
        var selection = app.selection;
        if (!selection.isCollapsed)
            return false;
        var head = selection.head;
        console.log('before input', node.id.toString(), node.textContent);
        var text = '';
        if (node.isEmpty) {
            text = event.data;
        }
        else {
            var textContent = node.textContent;
            text = textContent.slice(0, head.offset) + event.data + textContent.slice(head.offset);
        }
        console.log("\"" + text + "\"", node.id.toString(), node.textContent);
        var done = this.rules.some(function (rule) { return rule.execute(ctx, text); });
        return done;
    };
    return BeforeInputRuleHandler;
}());
exports.BeforeInputRuleHandler = BeforeInputRuleHandler;
var AfterInputRuleHandler = /** @class */ (function () {
    function AfterInputRuleHandler(rules) {
        this.rules = rules;
    }
    // process the event based on existing node.textContent
    AfterInputRuleHandler.prototype.process = function (ctx, node) {
        var text = node.textContent;
        return this.rules.some(function (rule) { return rule.execute(ctx, text); });
    };
    return AfterInputRuleHandler;
}());
exports.AfterInputRuleHandler = AfterInputRuleHandler;
// used in afterInput
var AfterInputRule = /** @class */ (function (_super) {
    __extends(AfterInputRule, _super);
    function AfterInputRule() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return AfterInputRule;
}(InputRule));
exports.AfterInputRule = AfterInputRule;
var PasteRule = /** @class */ (function () {
    function PasteRule(regex, handler) {
        this.regex = regex;
        this.handler = handler;
    }
    PasteRule.prototype.execute = function (ctx, text) {
        if (this.regex.test(text)) {
            this.handler(ctx);
            return true;
        }
        return false;
    };
    PasteRule.prototype.merge = function (rule) {
        throw new Error('Method not implemented.');
    };
    return PasteRule;
}());
exports.PasteRule = PasteRule;
