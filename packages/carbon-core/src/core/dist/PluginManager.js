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
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
exports.__esModule = true;
exports.PluginManager = void 0;
var is_hotkey_1 = require("is-hotkey");
var lodash_1 = require("lodash");
var EventContext_1 = require("./EventContext");
var CarbonPlugin_1 = require("./CarbonPlugin");
var Event_1 = require("./Event");
// handles events by executing proper plugin
var PluginManager = /** @class */ (function () {
    function PluginManager(plugins) {
        var flattened = this.flatten(plugins);
        // console.log(flattened)
        this.after = this.filter(flattened, CarbonPlugin_1.PluginType.After);
        this.before = this.filter(flattened, CarbonPlugin_1.PluginType.Before);
        this.nodes = this.filter(flattened, CarbonPlugin_1.PluginType.Node)
            .reduce(function (o, p) {
            var _a;
            return (__assign(__assign({}, o), (_a = {}, _a[p.name] = p, _a)));
        }, {});
        // console.log(keys(this.nodes).length, this.nodes)
        var events = flattened.reduce(function (es, p) { return es.concat(lodash_1.keys(p.on()).map(function (k) { return lodash_1.camelCase(k); })); }, []);
        this.events = new Set(events.concat([Event_1.EventsIn.keyDown]));
    }
    Object.defineProperty(PluginManager.prototype, "plugins", {
        get: function () {
            var _a = this, after = _a.after, before = _a.before, nodes = _a.nodes;
            return __spreadArrays(after, lodash_1.values(nodes), before);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(PluginManager.prototype, "specs", {
        get: function () {
            var nodes = {};
            lodash_1.each(this.nodes, function (node, name) {
                nodes[name] = node.spec();
            });
            return {
                nodes: nodes
            };
        },
        enumerable: false,
        configurable: true
    });
    PluginManager.prototype.flatten = function (plugins) {
        var _this = this;
        var allPlugins = plugins.reduce(function (arr, p) {
            return __spreadArrays(arr, [p], _this.flatten(p.plugins()));
        }, []);
        return lodash_1.uniqBy(lodash_1.sortBy(allPlugins, function (a) { return -a.priority; }), function (p) { return p.name; });
    };
    // collect plugin commands
    PluginManager.prototype.commands = function (app) {
        var commands = this.plugins.reduce(function (commands, p) {
            var _a;
            var pluginCommands = lodash_1.reduce(p.commands(), function (o, fn, name) {
                var _a;
                return __assign(__assign({}, o), (_a = {}, _a[name] = function () {
                    var args = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        args[_i] = arguments[_i];
                    }
                    return fn.bind(p).apply(void 0, __spreadArrays([app], args));
                }, _a));
            }, {});
            return __assign(__assign({}, commands), (_a = {}, _a[p.name] = pluginCommands, _a));
        }, {});
        return commands;
    };
    PluginManager.prototype.mounted = function (app, node) {
        lodash_1.each(this.before, function (p) { return p.mounted(app, node); });
        lodash_1.each(this.after, function (p) { return p.mounted(app, node); });
    };
    PluginManager.prototype.updated = function (app, node) {
        var _a;
        lodash_1.each(this.before, function (p) { return p.updated(app, node); });
        (_a = this.nodes[node.name]) === null || _a === void 0 ? void 0 : _a.updated(app, node);
        lodash_1.each(this.after, function (p) { return p.updated(app, node); });
    };
    PluginManager.prototype.destroyed = function (app) { };
    PluginManager.prototype.plugin = function (name) {
        var _a, _b;
        return (_b = (_a = this.nodes[name]) !== null && _a !== void 0 ? _a : this.before.find(function (p) { return p.name === name; })) !== null && _b !== void 0 ? _b : this.after.find(function (p) { return p.name === name; });
    };
    // handle incoming events from ui
    PluginManager.prototype.onEvent = function (event) {
        // console.log(event.type, event, event.node?.name);
        // keyDown is handled explicitly using Plugin.keydown()
        if (event.type === 'keyDown') {
            this.onKeyDown(event);
        }
        // simulate onInput event as Event.defaultPrevent() on beforeInput event stops dom onInput Event trigger
        if (event.type === 'keyUp') {
            var afterEvent = EventContext_1.EventContext.fromContext(event, { type: Event_1.EventsIn.input });
            this.handleEvent(afterEvent);
        }
        // console.log(event.type, event);
        this.handleEvent(event);
    };
    // handles any event
    // methods returned from Plugin.on() are executed
    PluginManager.prototype.handleEvent = function (event) {
        var _this = this;
        if (event.stopped)
            return;
        var node = event.node;
        lodash_1.some(this.before, function (p) { var _a, _b; return event.stopped || ((_b = (_a = p.on())[event.type]) === null || _b === void 0 ? void 0 : _b.call(_a, event)); });
        if (!event.stopped) {
            node === null || node === void 0 ? void 0 : node.chain.some(function (n) {
                var _a, _b, _c;
                // console.log(n.name, event.type, node?.chain.length);
                event.changeNode(n);
                (_c = (_a = _this.nodePlugin(n.name)) === null || _a === void 0 ? void 0 : (_b = _a.on())[lodash_1.camelCase(event.type)]) === null || _c === void 0 ? void 0 : _c.call(_b, event);
                return event.stopped;
            });
        }
        event.changeNode(node);
        lodash_1.some(this.after, function (p) { var _a, _b; return event.stopped || ((_b = (_a = p.on())[event.type]) === null || _b === void 0 ? void 0 : _b.call(_a, event)); });
    };
    // methods returned from Plugin.keydown() are executed
    PluginManager.prototype.onKeyDown = function (event) {
        var _this = this;
        var keyDownEvent = EventContext_1.EventContext.fromContext(event);
        var node = keyDownEvent.node;
        lodash_1.each(this.before, function (p) {
            var _a;
            if (keyDownEvent.stopped)
                return;
            var handlers = p.keydown();
            var handler = lodash_1.entries(handlers).find(function (_a) {
                var key = _a[0];
                // console.log(snakeCase(key).replace('_', '+'));
                return is_hotkey_1.isKeyHotkey(lodash_1.snakeCase(key).replace('_', '+'))(keyDownEvent.event);
            });
            (_a = handler === null || handler === void 0 ? void 0 : handler[1]) === null || _a === void 0 ? void 0 : _a.call(handler, keyDownEvent);
        });
        if (!keyDownEvent.stopped) {
            node === null || node === void 0 ? void 0 : node.chain.some(function (n) {
                var _a, _b, _c, _d, _e, _f;
                keyDownEvent.changeNode(n);
                (_c = (_a = _this.nodePlugin(n.name)) === null || _a === void 0 ? void 0 : (_b = _a.keydown())[keyDownEvent.type]) === null || _c === void 0 ? void 0 : _c.call(_b, keyDownEvent);
                var handlers = ((_e = (_d = _this.nodePlugin(n.type.name)) === null || _d === void 0 ? void 0 : _d.keydown()) !== null && _e !== void 0 ? _e : {});
                var handler = lodash_1.entries(handlers).find(function (_a) {
                    var key = _a[0];
                    return is_hotkey_1.isKeyHotkey(lodash_1.snakeCase(key).replace('_', '+'))(keyDownEvent.event);
                });
                (_f = handler === null || handler === void 0 ? void 0 : handler[1]) === null || _f === void 0 ? void 0 : _f.call(handler, keyDownEvent);
                return keyDownEvent.stopped;
            });
        }
        if (keyDownEvent.stopped)
            return;
        keyDownEvent.changeNode(node);
        lodash_1.some(this.after, function (p) {
            var _a;
            var handlers = p.keydown();
            var handler = lodash_1.entries(handlers).find(function (_a) {
                var key = _a[0];
                return is_hotkey_1.isKeyHotkey(lodash_1.snakeCase(key).replace('_', '+'))(keyDownEvent.event);
            });
            (_a = handler === null || handler === void 0 ? void 0 : handler[1]) === null || _a === void 0 ? void 0 : _a.call(handler, keyDownEvent);
            return keyDownEvent.stopped;
        });
    };
    // onSelect(event: SelectionEvent) {
    // 	each(this.before, p => p.select(event));
    // 	each(this.after, p => p.select(event));
    // }
    PluginManager.prototype.afterRender = function (app) {
        // each(this.before, p => p.afterRender(editor));
        // each(this.after, p => p.afterRender(editor));
    };
    PluginManager.prototype.decoration = function (app) {
        var decorations = app.state.decorations;
        // each(this.before, p => {
        // 	p.decoration(app).forEach(d => decorations.set(d.span, d));
        // });
        // each(this.nodes, p => {
        // 	p.decoration(app).forEach(d => decorations.set(d.span, d));
        // })
        // each(this.after, p => {
        // 	p.decoration(app).forEach(d => decorations.set(d.span, d));
        // });
    };
    PluginManager.prototype.onTransaction = function (tr) {
        // each(this.before, p => p.transaction(tr));
        // each(this.after, p => p.transaction(tr));
    };
    PluginManager.prototype.normalize = function (node, app) {
        var _a;
        for (var _i = 0, _b = this.before; _i < _b.length; _i++) {
            var p = _b[_i];
            var actions_1 = p.normalize(node, app.state);
            if (actions_1.length)
                return actions_1;
        }
        var actions = (_a = this.nodes[node.name]) === null || _a === void 0 ? void 0 : _a.normalize(node, app.state);
        if (actions.length)
            return actions;
        for (var _c = 0, _d = this.after; _c < _d.length; _c++) {
            var p = _d[_c];
            var actions_2 = p.normalize(node, app.state);
            if (actions_2.length)
                return actions_2;
        }
        return [];
    };
    PluginManager.prototype.nodePlugin = function (name) {
        return this.nodes[name];
    };
    PluginManager.prototype.serialize = function (app, node) {
        var _a, _b;
        return (_b = (_a = this.nodePlugin(node.name)) === null || _a === void 0 ? void 0 : _a.serialize(app, node)) !== null && _b !== void 0 ? _b : '';
    };
    PluginManager.prototype.deserialize = function (app, serialized) {
        // return this.nodePlugin(node.name)?.serialize(app, node) ?? '';
        return [];
    };
    PluginManager.prototype.filter = function (plugins, type) {
        return plugins.filter(function (p) { return p.type === type; });
    };
    return PluginManager;
}());
exports.PluginManager = PluginManager;
