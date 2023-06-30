"use strict";
exports.__esModule = true;
exports.ContentMatch = void 0;
var Fragment_1 = require("./Fragment");
/// Instances of this class represent a match state of a node type's
/// [content expression](#model.NodeSpec.content), and can be used to
/// find out whether further content matches here, and whether a given
/// position is a valid end of the node.
var ContentMatch = /** @class */ (function () {
    /// @internal
    function ContentMatch(
    /// True when this match state represents a valid end of the node.
    validEnd) {
        this.validEnd = validEnd;
        /// @internal
        this.next = [];
        /// @internal
        this.wrapCache = [];
    }
    ContentMatch.parse = function (string, nodeTypes) {
        var stream = new TokenStream(string, nodeTypes);
        if (stream.next == null)
            return ContentMatch.empty;
        var expr = parseExpr(stream);
        if (stream.next)
            stream.err("Unexpected trailing text");
        var match = dfa(nfa(expr));
        checkForDeadEnds(match, stream);
        return match;
    };
    /// Match a node type, returning a match after that node if
    /// successful.
    ContentMatch.prototype.matchType = function (type) {
        for (var i = 0; i < this.next.length; i++)
            if (this.next[i].type == type)
                return this.next[i].next;
        return null;
    };
    /// Try to match a fragment. Returns the resulting match when
    /// successful.
    ContentMatch.prototype.matchFragment = function (frag, start, end) {
        if (start === void 0) { start = 0; }
        if (end === void 0) { end = frag.childCount; }
        var cur = this;
        for (var i = start; cur && i < end; i++)
            cur = cur.matchType(frag.child(i).type);
        return cur;
    };
    Object.defineProperty(ContentMatch.prototype, "inlineContent", {
        /// @internal
        get: function () {
            return this.next.length != 0 && this.next[0].type.isInline;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ContentMatch.prototype, "defaultType", {
        /// Get the first matching node type at this match position that can
        /// be generated.
        get: function () {
            for (var i = 0; i < this.next.length; i++) {
                var type = this.next[i].type;
                if (!(type.isText || type.hasRequiredAttrs()))
                    return type;
            }
            return null;
        },
        enumerable: false,
        configurable: true
    });
    /// @internal
    ContentMatch.prototype.compatible = function (other) {
        for (var i = 0; i < this.next.length; i++)
            for (var j = 0; j < other.next.length; j++)
                if (this.next[i].type == other.next[j].type)
                    return true;
        return false;
    };
    /// Try to match the given fragment, and if that fails, see if it can
    /// be made to match by inserting nodes in front of it. When
    /// successful, return a fragment of inserted nodes (which may be
    /// empty if nothing had to be inserted). When `toEnd` is true, only
    /// return a fragment if the resulting match goes to the end of the
    /// content expression.
    ContentMatch.prototype.fillBefore = function (after, toEnd, startIndex) {
        if (toEnd === void 0) { toEnd = false; }
        if (startIndex === void 0) { startIndex = 0; }
        var seen = [this];
        function search(match, types) {
            var finished = match.matchFragment(after, startIndex);
            if (finished && (!toEnd || finished.validEnd))
                return Fragment_1.Fragment.from(types.map(function (tp) { return tp.createAndFill(); }));
            for (var i = 0; i < match.next.length; i++) {
                var _a = match.next[i], type = _a.type, next = _a.next;
                if (!(type.isText || type.hasRequiredAttrs()) && seen.indexOf(next) == -1) {
                    seen.push(next);
                    var found = search(next, types.concat(type));
                    if (found)
                        return found;
                }
            }
            return null;
        }
        return search(this, []);
    };
    /// Find a set of wrapping node types that would allow a node of the
    /// given type to appear at this position. The result may be empty
    /// (when it fits directly) and will be null when no such wrapping
    /// exists.
    ContentMatch.prototype.findWrapping = function (target) {
        for (var i = 0; i < this.wrapCache.length; i += 2)
            if (this.wrapCache[i] == target)
                return this.wrapCache[i + 1];
        var computed = this.computeWrapping(target);
        this.wrapCache.push(target, computed);
        return computed;
    };
    /// @internal
    ContentMatch.prototype.computeWrapping = function (target) {
        var seen = Object.create(null), active = [{ match: this, type: null, via: null }];
        while (active.length) {
            var current = active.shift(), match = current.match;
            if (match.matchType(target)) {
                var result = [];
                for (var obj = current; obj.type; obj = obj.via)
                    result.push(obj.type);
                return result.reverse();
            }
            for (var i = 0; i < match.next.length; i++) {
                var _a = match.next[i], type = _a.type, next = _a.next;
                if (!type.isLeaf && !type.hasRequiredAttrs() && !(type.name in seen) && (!current.type || next.validEnd)) {
                    active.push({ match: type.contentMatch, type: type, via: current });
                    seen[type.name] = true;
                }
            }
        }
        return null;
    };
    Object.defineProperty(ContentMatch.prototype, "edgeCount", {
        /// The number of outgoing edges this node has in the finite
        /// automaton that describes the content expression.
        get: function () {
            return this.next.length;
        },
        enumerable: false,
        configurable: true
    });
    /// Get the _n_​th outgoing edge from this node in the finite
    /// automaton that describes the content expression.
    ContentMatch.prototype.edge = function (n) {
        if (n >= this.next.length)
            throw new RangeError("There's no " + n + "th edge in this content match");
        return this.next[n];
    };
    /// @internal
    ContentMatch.prototype.toString = function () {
        var seen = [];
        function scan(m) {
            seen.push(m);
            for (var i = 0; i < m.next.length; i++)
                if (seen.indexOf(m.next[i].next) == -1)
                    scan(m.next[i].next);
        }
        scan(this);
        return seen.map(function (m, i) {
            var out = i + (m.validEnd ? "*" : " ") + " ";
            for (var i_1 = 0; i_1 < m.next.length; i_1++)
                out += (i_1 ? ", " : "") + m.next[i_1].type.name + "->" + seen.indexOf(m.next[i_1].next);
            return out;
        }).join("\n");
    };
    /// @internal
    ContentMatch.empty = new ContentMatch(true);
    return ContentMatch;
}());
exports.ContentMatch = ContentMatch;
var TokenStream = /** @class */ (function () {
    function TokenStream(string, nodeTypes) {
        this.string = string;
        this.nodeTypes = nodeTypes;
        this.inline = null;
        this.pos = 0;
        this.tokens = string.split(/\s*(?=\b|\W|$)/);
        if (this.tokens[this.tokens.length - 1] == "")
            this.tokens.pop();
        if (this.tokens[0] == "")
            this.tokens.shift();
    }
    Object.defineProperty(TokenStream.prototype, "next", {
        get: function () { return this.tokens[this.pos]; },
        enumerable: false,
        configurable: true
    });
    TokenStream.prototype.eat = function (tok) { return this.next == tok && (this.pos++ || true); };
    TokenStream.prototype.err = function (str) { throw new SyntaxError(str + " (in content expression '" + this.string + "')"); };
    return TokenStream;
}());
function parseExpr(stream) {
    var exprs = [];
    do {
        exprs.push(parseExprSeq(stream));
    } while (stream.eat("|"));
    return exprs.length == 1 ? exprs[0] : { type: "choice", exprs: exprs };
}
function parseExprSeq(stream) {
    var exprs = [];
    do {
        exprs.push(parseExprSubscript(stream));
    } while (stream.next && stream.next != ")" && stream.next != "|");
    return exprs.length == 1 ? exprs[0] : { type: "seq", exprs: exprs };
}
function parseExprSubscript(stream) {
    var expr = parseExprAtom(stream);
    for (;;) {
        if (stream.eat("+"))
            expr = { type: "plus", expr: expr };
        else if (stream.eat("*"))
            expr = { type: "star", expr: expr };
        else if (stream.eat("?"))
            expr = { type: "opt", expr: expr };
        else if (stream.eat("{"))
            expr = parseExprRange(stream, expr);
        else
            break;
    }
    return expr;
}
function parseNum(stream) {
    if (/\D/.test(stream.next))
        stream.err("Expected number, got '" + stream.next + "'");
    var result = Number(stream.next);
    stream.pos++;
    return result;
}
function parseExprRange(stream, expr) {
    var min = parseNum(stream), max = min;
    if (stream.eat(",")) {
        if (stream.next != "}")
            max = parseNum(stream);
        else
            max = -1;
    }
    if (!stream.eat("}"))
        stream.err("Unclosed braced range");
    return { type: "range", min: min, max: max, expr: expr };
}
function resolveName(stream, name) {
    var types = stream.nodeTypes, type = types[name];
    if (type)
        return [type];
    var result = [];
    for (var typeName in types) {
        var type_1 = types[typeName];
        if (type_1.groupsNames.indexOf(name) > -1)
            result.push(type_1);
    }
    if (result.length == 0)
        stream.err("No node type or group '" + name + "' found");
    return result;
}
function parseExprAtom(stream) {
    if (stream.eat("(")) {
        var expr = parseExpr(stream);
        if (!stream.eat(")")) {
            stream.err("Missing closing paren");
        }
        return expr;
    }
    else if (!/\W/.test(stream.next)) {
        var exprs = resolveName(stream, stream.next).map(function (type) {
            if (stream.inline == null) {
                stream.inline = type.isInline;
            }
            else if (stream.inline != type.isInline) {
                stream.err("Mixing inline and block content");
            }
            return { type: "name", value: type };
        });
        stream.pos++;
        return exprs.length == 1 ? exprs[0] : { type: "choice", exprs: exprs };
    }
    else {
        stream.err("Unexpected token '" + stream.next + "'");
    }
}
/// Construct an NFA from an expression as returned by the parser. The
/// NFA is represented as an array of states, which are themselves
/// arrays of edges, which are `{term, to}` objects. The first state is
/// the entry state and the last node is the success state.
///
/// Note that unlike typical NFAs, the edge ordering in this one is
/// significant, in that it is used to contruct filler content when
/// necessary.
function nfa(expr) {
    var nfa = [[]];
    connect(compile(expr, 0), node());
    return nfa;
    function node() { return nfa.push([]) - 1; }
    function edge(from, to, term) {
        var edge = { term: term, to: to };
        nfa[from].push(edge);
        return edge;
    }
    function connect(edges, to) {
        edges.forEach(function (edge) { return edge.to = to; });
    }
    function compile(expr, from) {
        if (expr.type == "choice") {
            return expr.exprs.reduce(function (out, expr) { return out.concat(compile(expr, from)); }, []);
        }
        else if (expr.type == "seq") {
            for (var i = 0;; i++) {
                var next = compile(expr.exprs[i], from);
                if (i == expr.exprs.length - 1)
                    return next;
                connect(next, from = node());
            }
        }
        else if (expr.type == "star") {
            var loop = node();
            edge(from, loop);
            connect(compile(expr.expr, loop), loop);
            return [edge(loop)];
        }
        else if (expr.type == "plus") {
            var loop = node();
            connect(compile(expr.expr, from), loop);
            connect(compile(expr.expr, loop), loop);
            return [edge(loop)];
        }
        else if (expr.type == "opt") {
            return [edge(from)].concat(compile(expr.expr, from));
        }
        else if (expr.type == "range") {
            var cur = from;
            for (var i = 0; i < expr.min; i++) {
                var next = node();
                connect(compile(expr.expr, cur), next);
                cur = next;
            }
            if (expr.max == -1) {
                connect(compile(expr.expr, cur), cur);
            }
            else {
                for (var i = expr.min; i < expr.max; i++) {
                    var next = node();
                    edge(cur, next);
                    connect(compile(expr.expr, cur), next);
                    cur = next;
                }
            }
            return [edge(cur)];
        }
        else if (expr.type == "name") {
            return [edge(from, undefined, expr.value)];
        }
        else {
            throw new Error("Unknown expr type");
        }
    }
}
function cmp(a, b) { return b - a; }
// Get the set of nodes reachable by null edges from `node`. Omit
// nodes with only a single null-out-edge, since they may lead to
// needless duplicated nodes.
function nullFrom(nfa, node) {
    var result = [];
    scan(node);
    return result.sort(cmp);
    function scan(node) {
        var edges = nfa[node];
        if (edges.length == 1 && !edges[0].term)
            return scan(edges[0].to);
        result.push(node);
        for (var i = 0; i < edges.length; i++) {
            var _a = edges[i], term = _a.term, to = _a.to;
            if (!term && result.indexOf(to) == -1)
                scan(to);
        }
    }
}
// Compiles an NFA as produced by `nfa` into a DFA, modeled as a set
// of state objects (`ContentMatch` instances) with transitions
// between them.
function dfa(nfa) {
    var labeled = Object.create(null);
    return explore(nullFrom(nfa, 0));
    function explore(states) {
        var out = [];
        states.forEach(function (node) {
            nfa[node].forEach(function (_a) {
                var term = _a.term, to = _a.to;
                if (!term)
                    return;
                var set;
                for (var i = 0; i < out.length; i++)
                    if (out[i][0] == term)
                        set = out[i][1];
                nullFrom(nfa, to).forEach(function (node) {
                    if (!set)
                        out.push([term, set = []]);
                    if (set.indexOf(node) == -1)
                        set.push(node);
                });
            });
        });
        var state = labeled[states.join(",")] = new ContentMatch(states.indexOf(nfa.length - 1) > -1);
        for (var i = 0; i < out.length; i++) {
            var states_1 = out[i][1].sort(cmp);
            state.next.push({ type: out[i][0], next: labeled[states_1.join(",")] || explore(states_1) });
        }
        return state;
    }
}
function checkForDeadEnds(match, stream) {
    for (var i = 0, work = [match]; i < work.length; i++) {
        var state = work[i], dead = !state.validEnd;
        var nodes = [];
        for (var j = 0; j < state.next.length; j++) {
            var _a = state.next[j], type = _a.type, next = _a.next;
            nodes.push(type.name);
            if (dead && !(type.isText || type.hasRequiredAttrs()))
                dead = false;
            if (work.indexOf(next) == -1)
                work.push(next);
        }
        if (dead)
            stream.err("Only non-generatable nodes (" + nodes.join(", ") + ") in a required position (see https://prosemirror.net/docs/guide/#generatable)");
    }
}
