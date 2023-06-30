"use strict";
exports.__esModule = true;
exports.generateBlockId = exports.generateTextId = exports.generateActionId = void 0;
var cmd = 0;
exports.generateActionId = function () {
    return ++cmd;
};
var nodeId = 0;
exports.generateTextId = function () {
    return String(++nodeId);
};
var blockId = 0;
exports.generateBlockId = function () {
    return 'b' + String(++nodeId);
    // return uuidv4();
};
