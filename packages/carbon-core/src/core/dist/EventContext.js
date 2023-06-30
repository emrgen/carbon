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
exports.__esModule = true;
exports.EventContext = exports.EventOrigin = void 0;
var EventOrigin;
(function (EventOrigin) {
    EventOrigin[EventOrigin["dom"] = 0] = "dom";
    EventOrigin[EventOrigin["custom"] = 1] = "custom";
})(EventOrigin = exports.EventOrigin || (exports.EventOrigin = {}));
//
var EventContext = /** @class */ (function () {
    function EventContext(props) {
        this.stopped = false;
        this.prevented = false;
        var origin = props.origin, type = props.type, app = props.app, node = props.node, event = props.event, selection = props.selection;
        this.origin = origin;
        this.type = type;
        this.app = app;
        this.node = node;
        this.target = node;
        this.event = event;
        this.selection = selection;
    }
    // create a new event context
    EventContext.create = function (props) {
        return new EventContext(__assign({}, props));
    };
    // create a new event context from an existing one
    EventContext.fromContext = function (event, opts) {
        if (opts === void 0) { opts = {}; }
        return EventContext.create(__assign(__assign({}, event), opts));
    };
    // updateCommandOrigin(type: EventsIn, event: Event) {
    EventContext.prototype.changeNode = function (node) {
        this.node = node;
    };
    EventContext.prototype.preventDefault = function () {
        this.prevented = true;
        return this;
    };
    EventContext.prototype.stopPropagation = function () {
        this.stopped = true;
        return this;
    };
    return EventContext;
}());
exports.EventContext = EventContext;
