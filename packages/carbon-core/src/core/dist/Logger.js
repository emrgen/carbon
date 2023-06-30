"use strict";
exports.__esModule = true;
exports.withCons = exports.jsonStr = exports.classString = exports.p40 = exports.p30 = exports.p20 = exports.p14 = exports.p12 = exports.pad = void 0;
var lodash_1 = require("lodash");
exports.pad = function (s, size, fill) {
    if (s === void 0) { s = ''; }
    if (size === void 0) { size = 10; }
    if (fill === void 0) { fill = ' '; }
    return s.padEnd(size, fill);
};
exports.p12 = function (s, fill) {
    if (s === void 0) { s = ''; }
    if (fill === void 0) { fill = ' '; }
    return s.padEnd(12, fill);
};
exports.p14 = function (s, fill) {
    if (s === void 0) { s = ''; }
    if (fill === void 0) { fill = ' '; }
    return s.padEnd(14, fill);
};
exports.p20 = function (s, fill) {
    if (s === void 0) { s = ''; }
    if (fill === void 0) { fill = ' '; }
    return s.padEnd(20, fill);
};
exports.p30 = function (s, fill) {
    if (s === void 0) { s = ''; }
    if (fill === void 0) { fill = ' '; }
    return s.padEnd(30, fill);
};
exports.p40 = function (s, fill) {
    if (s === void 0) { s = ''; }
    if (fill === void 0) { fill = ' '; }
    return s.padEnd(40, fill);
};
var colorMap = {
    info: 'pink',
    warning: 'cyan',
    error: 'red',
    fatal: 'red',
    failed: 'red',
    invalid: 'grey',
    command: 'blue',
    create: 'green',
    event: 'teal'
};
exports.classString = function (cons) { return function (json) {
    var makeString = exports.withCons(cons);
    if (lodash_1.isString(json)) {
        return makeString(json);
    }
    if (lodash_1.isArray(json)) {
        return makeString(json.join(', '));
    }
    if (lodash_1.isObject(json)) {
        return makeString(exports.jsonStr(json));
    }
    return cons.constructor.name;
}; };
exports.jsonStr = function (json) { return lodash_1.entries(json).map(function (_a) {
    var k = _a[0], v = _a[1];
    return k + ": " + v.toString();
}).join(', '); };
exports.withCons = function (obj) { return function (str) { return obj.constructor.name + "(" + str + ")"; }; };
