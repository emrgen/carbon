"use strict";
exports.__esModule = true;
exports.RenderManager = exports.Renderer = void 0;
var Renderer = /** @class */ (function () {
    function Renderer(name, comp) {
        this.name = name;
        this.component = comp;
    }
    Renderer.create = function (name, component) {
        return new Renderer(name, component);
    };
    return Renderer;
}());
exports.Renderer = Renderer;
var RenderManager = /** @class */ (function () {
    function RenderManager(renderers, fallback) {
        this.name = "renderManager";
        this.renderers = renderers;
        this.fallback = fallback;
    }
    RenderManager.create = function (renderers, fallback) {
        var rendererMap = new Map();
        renderers.forEach(function (r) {
            rendererMap.set(r.name, r.component);
        });
        return new RenderManager(rendererMap, fallback);
    };
    RenderManager.prototype.component = function (name) {
        var _a;
        return (_a = this.renderers.get(name)) !== null && _a !== void 0 ? _a : this.fallback;
    };
    return RenderManager;
}());
exports.RenderManager = RenderManager;
