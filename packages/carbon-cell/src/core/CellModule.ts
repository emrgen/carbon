import { Node, NodeIdMap } from "@emrgen/carbon-core";
import { NodeId } from "@emrgen/carbon-core";
import { Carbon } from "@emrgen/carbon-core";
import { EventEmitter } from "events";
import { Module, Runtime } from "@observablehq/runtime";
import { parseCell, peekId } from "@observablehq/parser";
import { Optional } from "@emrgen/types";
import { CodeCellValuePath } from "../constants";

//
export class CellModule extends EventEmitter {
  readonly app: Carbon;
  cells: NodeIdMap<Node>;
  // cache the views of the cells
  views: NodeIdMap<Optional<HTMLElement>>;
  runtime: Runtime;
  module: Module;

  defined: Set<string> = new Set();

  results: NodeIdMap<any> = new NodeIdMap();

  nodes: NodeIdMap<any> = new NodeIdMap();

  ids: NodeIdMap<string> = new NodeIdMap();

  variables: NodeIdMap<any> = new NodeIdMap();

  cache: NodeIdMap<string> = new NodeIdMap();

  constructor(app: Carbon) {
    super();
    this.app = app;
    this.cells = new NodeIdMap();
    this.views = new NodeIdMap();
    this.runtime = new Runtime();
    this.module = this.runtime.module();
    this.module.variable(true).define("_module", [], () => this.module);
  }

  add(node: Node) {
    this.cells.set(node.id, node);
  }

  remove(node: Node) {
    this.cells.delete(node.id);
  }

  get(id: NodeId) {
    return this.cells.get(id);
  }

  has(id: NodeId) {
    return this.cells.has(id);
  }

  compute() {}

  removeVariable(nodeId: NodeId) {
    this.results.set(nodeId, "");
    this.ids.set(nodeId, "");
    this.nodes.set(nodeId, "");
    this.variables.get(nodeId)?.delete();
    this.variables.delete(nodeId);

    this.fulfilled("", nodeId, "");
  }

  redefine(nodeId: NodeId) {
    const cell = this.app.store.get(nodeId);
    const codeNode = cell?.child(1);
    const code = codeNode?.props.get(CodeCellValuePath, "") ?? "";

    // check if the code is the same as the cache code for the node
    const cache = this.cache.get(nodeId);
    if (code === cache) return;
    this.cache.set(nodeId, code);

    if (!code) {
      this.removeVariable(nodeId);
      return;
    }

    try {
      // if code type is javascript
      // find the cell id add create a variable
      const id = peekId(code);
      const ast = parseCell(code);
      console.log("define cell", id, ast);

      if (!ast.body) {
        this.removeVariable(nodeId);
        return;
      }

      switch (ast.body.type) {
        case "Identifier":
          this.defineIdentifier(nodeId, id, ast, code);
          break;
        case "TaggedTemplateExpression":
          this.defineTemplateExpression(nodeId, id, ast, code);
          break;
        case "ArrowFunctionExpression":
          this.defineArrowFunction(nodeId, id, ast, code);
          break;
        case "FunctionExpression":
          this.defineFunction(nodeId, id, ast, code);
          break;
        case "BlockStatement":
          this.defineBlock(nodeId, id, ast, code);
          break;
        case "CallExpression":
          this.defineCallExpr(nodeId, id, ast, code);
          break;
        case "Literal":
          this.defineLiteral(nodeId, id, ast, code);
          break;
        case "BinaryExpression":
        case "MemberExpression":
          this.defineBinaryExpression(nodeId, id, ast, code);
          break;
      }
    } catch (err) {
      console.error(err);
    }

    // if code type is markdown

    // const md = parse(code);
    // if (view) {
    //   @ts-ignore
    // view.innerHTML = md;
    // }

    // console.log("redefine variable", view, nodeId, code);
  }

  createDefinition(code: string): {
    id: string;
    definition: Function;
    dependencies: string[];
  } {
    return {
      id: "",
      definition: () => {},
      dependencies: [],
    };
  }

  fnName(id: string) {
    return !!id ? `_${id}` : "";
  }

  defineBinaryExpression(nodeId, id, ast, code) {
    const { body, references, id: idNode } = ast;
    const deps = references.map((arg: any) => arg.name);
    const fnBodyStr = code.slice(body.start, body.end);

    if (idNode?.type === "ViewExpression") {
      const view_variable_name = `$view_${idNode.name}`;
      const fn = new Function(
        `return function _view${this.fnName(id)} ( ${deps.join(",")} ) { return ${fnBodyStr} }`,
      )();

      this.define(nodeId, view_variable_name, deps, fn);
    } else {
      const fn = new Function(
        `return function ${this.fnName(id)}( ${deps.join(",")} ) { return ${fnBodyStr} }`,
      )();
      this.define(nodeId, id, deps, fn);
    }
  }

  defineTemplateExpression(nodeId, id, ast, code) {
    const { body, references } = ast;
    const deps = references.map((arg: any) => arg.name);
    const fnBodyStr = code.slice(body.start, body.end);

    const fn = new Function(
      `return function ${this.fnName(id)}( ${deps.join(",")} ) { return ${fnBodyStr} }`,
    )();
    this.define(nodeId, id, deps, fn);
  }

  defineLiteral(nodeId, id, ast, code) {
    const { body, references } = ast;
    const deps = references.map((arg: any) => arg.name);
    const fn = () => body.value;
    this.define(nodeId, id, deps, fn);
  }

  defineIdentifier(nodeId, id, ast, code) {
    const { body } = ast;
    const deps = [body.name];
    const fn = (a) => a;
    this.define(nodeId, id, deps, fn);
  }

  defineCallExpr(nodeId, id: string, ast: any, code: string) {
    const { body, references, id: idNode } = ast;
    const fnBodyStr = code.slice(body.start, body.end);

    const deps = references.map((arg: any) => arg.name);

    console.log(idNode);
    if (idNode?.type === "ViewExpression") {
      const view_variable_name = `_view_${idNode.id.name}`;
      const fn = new Function(
        `return function _view${this.fnName(id)} ( ${deps.join(",")} ) { return ${fnBodyStr} }`,
      )();

      this.define(nodeId, view_variable_name, deps, fn);
      this.define(NodeId.IDENTITY, id, [view_variable_name], (form) => {
        return {
          type: "ViewForm",
          source: view_variable_name,
          form: form,
        };
      });
    } else {
      const fn = new Function(
        `return function ${this.fnName(id)}( ${deps.join(",")} ) { return ${fnBodyStr} }`,
      )();
      this.define(nodeId, id, deps, fn);
    }
  }

  defineArrowFunction(nodeId, id: string, ast: any, code: string) {
    const { body, references } = ast;
    const fnBodyStr = code.slice(body.start, body.end);
    const deps = references.map((ref) => ref.name);

    const fn = new Function(
      `return function ${this.fnName(id)}( ${deps.join(",")} ) { return ${fnBodyStr} }`,
    )();

    console.log(body);
    this.nodes.set(nodeId, body);
    this.define(nodeId, id, deps, fn);
  }

  defineFunction(nodeId, id: string, ast: any, code: string) {
    const { body, references } = ast;
    const fnBodyStr = code.slice(body.start, body.end);
    const paramNames = body.params.map((param: any) => param.name);
    console.log(paramNames);

    const deps = references.map((ref) => ref.name);

    const fn = new Function(
      `return function ${this.fnName(id)}( ${deps.join(",")} ) { return ${fnBodyStr} }`,
    )();

    this.define(nodeId, id, deps, fn);
  }

  defineBlock(nodeId, id: string, ast: any, code: string) {
    const { body, references } = ast;
    const blockBodyStr = code.slice(body.start, body.end);
    const deps = references.map((ref) => ref.name);

    const fn = new Function(
      `return function ${this.fnName(id)}( ${deps.join(",")} ) ${blockBodyStr}`,
    )();

    this.define(nodeId, id, deps, fn);
  }

  define(nodeId, id, deps, definition) {
    console.log("XXX redefining", nodeId, id, deps, definition);
    if (this.defined.has(id)) {
      const prev = this.variables.get(nodeId);
      const v = this.module.redefine(id, deps, definition);
      this.variables.set(nodeId, v);
      // this.module.delete(prev);
    } else {
      const v = this.module
        .variable({
          fulfilled: (value) => {
            this.results.set(nodeId, value);
            this.ids.set(nodeId, id);
            this.fulfilled(id, nodeId, value);
            console.log("-> fulfilled", id, value);
          },
          rejected: (err) => {
            console.error(err);
          },
        })
        .define(id, deps, definition);

      this.variables.set(nodeId, v);
      if (id) {
        this.defined.add(id);
      }
    }
  }

  destroy() {
    console.log("destroy module");
  }

  private fulfilled(id, nodeId: NodeId, result) {
    this.emit(`fulfilled:${nodeId.toString()}`, id, nodeId, result);
  }
}
