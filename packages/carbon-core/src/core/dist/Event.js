"use strict";
exports.__esModule = true;
exports.EventsOut = exports.EventsIn = void 0;
// Incoming Event types from DOM
var EventsIn;
(function (EventsIn) {
    EventsIn["beforeinput"] = "beforeInput";
    EventsIn["input"] = "input";
    EventsIn["keyUp"] = "keyUp";
    EventsIn["keyDown"] = "keyDown";
    EventsIn["mouseDown"] = "mouseDown";
    EventsIn["mouseUp"] = "mouseUp";
    EventsIn["mouseMove"] = "mouseMove";
    EventsIn["mouseOver"] = "mouseOver";
    EventsIn["mouseOut"] = "mouseOut";
    EventsIn["scroll"] = "scroll";
    EventsIn["dragStart"] = "dragStart";
    EventsIn["drag"] = "drag";
    EventsIn["dragEnd"] = "dragEnd";
    EventsIn["copy"] = "copy";
    EventsIn["cut"] = "cut";
    EventsIn["paste"] = "paste";
    EventsIn["blur"] = "blur";
    EventsIn["focus"] = "focus";
    EventsIn["selectionchange"] = "selectionchange";
    EventsIn["selectstart"] = "selectstart";
    EventsIn["click"] = "click";
    EventsIn["doubleclick"] = "doubleClick";
    EventsIn["tripleclick"] = "tripleClick";
    EventsIn["custom"] = "custom";
    EventsIn["noop"] = "noop";
})(EventsIn = exports.EventsIn || (exports.EventsIn = {}));
// Outgoing Event types from the Editor
var EventsOut;
(function (EventsOut) {
    EventsOut["updateView"] = "update:view";
    EventsOut["change"] = "change";
    EventsOut["viewupdated"] = "view:updated";
    EventsOut["selectionchanged"] = "selection:changed";
    EventsOut["contentchanged"] = "content:changed";
    EventsOut["nodestatechanged"] = "nodestatechanged";
    EventsOut["transaction"] = "transaction";
    EventsOut["mounted"] = "mounted";
})(EventsOut = exports.EventsOut || (exports.EventsOut = {}));
