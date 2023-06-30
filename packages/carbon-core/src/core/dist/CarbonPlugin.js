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
exports.__esModule = true;
exports.CommandPlugin = exports.BeforePlugin = exports.AfterPlugin = exports.NodePlugin = exports.CarbonPlugin = exports.NodeKey = exports.PluginType = void 0;
var PluginType;
(function (PluginType) {
    PluginType[PluginType["Node"] = 0] = "Node";
    PluginType[PluginType["After"] = 1] = "After";
    PluginType[PluginType["Before"] = 2] = "Before";
    PluginType[PluginType["Command"] = 3] = "Command";
})(PluginType = exports.PluginType || (exports.PluginType = {}));
var NodeKey = /** @class */ (function () {
    function NodeKey(name) {
        this.name = name;
    }
    return NodeKey;
}());
exports.NodeKey = NodeKey;
// Plugin is a singleton object
// Editor delegates event processing to plugin
var CarbonPlugin = /** @class */ (function () {
    function CarbonPlugin() {
        // lower priority plugins will be processed first
        this.priority = 0;
        this.type = PluginType.Node;
        this.name = '';
        // experimental
        // subscribe(editor:Editor) { }
        // unsubscribe(editor:Editor) { }
        // publish(editor:Editor) { }
    }
    CarbonPlugin.prototype.spec = function () {
        return {};
    };
    // returned commands will be
    CarbonPlugin.prototype.commands = function () {
        return {};
    };
    // return dependency plugins
    CarbonPlugin.prototype.plugins = function () {
        return [];
    };
    // return editor event handlers
    CarbonPlugin.prototype.on = function () {
        return {};
    };
    CarbonPlugin.prototype.keydown = function () {
        return {};
    };
    CarbonPlugin.prototype.transaction = function (tr) { };
    // return decorations that will be applied on the view
    CarbonPlugin.prototype.decoration = function (state) {
        return [];
    };
    // normalize the node based on schema
    CarbonPlugin.prototype.normalize = function (node, state) { return []; };
    // node lifecycle hooks
    CarbonPlugin.prototype.mounted = function (editor, node) { };
    CarbonPlugin.prototype.updated = function (editor, node) { };
    CarbonPlugin.prototype.unmounted = function (editor, node) { };
    // serialize the node into a copy string
    CarbonPlugin.prototype.serialize = function (app, node) {
        return [];
    };
    // deserialize the copy string into a Node
    CarbonPlugin.prototype.deserialize = function (data) {
        return null;
    };
    return CarbonPlugin;
}());
exports.CarbonPlugin = CarbonPlugin;
var NodePlugin = /** @class */ (function (_super) {
    __extends(NodePlugin, _super);
    function NodePlugin() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.type = PluginType.Node;
        return _this;
    }
    return NodePlugin;
}(CarbonPlugin));
exports.NodePlugin = NodePlugin;
var AfterPlugin = /** @class */ (function (_super) {
    __extends(AfterPlugin, _super);
    function AfterPlugin() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.type = PluginType.After;
        return _this;
    }
    return AfterPlugin;
}(CarbonPlugin));
exports.AfterPlugin = AfterPlugin;
var BeforePlugin = /** @class */ (function (_super) {
    __extends(BeforePlugin, _super);
    function BeforePlugin() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.type = PluginType.Before;
        return _this;
    }
    return BeforePlugin;
}(CarbonPlugin));
exports.BeforePlugin = BeforePlugin;
var CommandPlugin = /** @class */ (function (_super) {
    __extends(CommandPlugin, _super);
    function CommandPlugin() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.type = PluginType.Command;
        return _this;
    }
    return CommandPlugin;
}(CarbonPlugin));
exports.CommandPlugin = CommandPlugin;
