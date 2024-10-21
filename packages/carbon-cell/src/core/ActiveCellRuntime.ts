import { EventEmitter } from "events";
import { Module, Runtime, Variable } from "@observablehq/runtime";
import { parseCell, peekId } from "@observablehq/parser";
import { Library } from "@observablehq/stdlib";
import { Optional } from "@emrgen/types";
import { nextUnnamedCellName } from "../utils";
import { isHtmlElement } from "../utils";
import { viewCellName } from "../utils";
import { isUnnamedCell } from "../utils";
import { isViewCell } from "../utils";
import { isString } from "lodash";
import { Nodes } from "./Nodes"; //

//
export class ActiveCellRuntime extends EventEmitter {
  // cache the views of the cells
  runtime: Runtime;
  module: Module;

  // cellId -> ActiveCell
  cells: Map<string, ActiveCell> = new Map();

  observedNodes: Set<string> = new Set();

  constructor(builtins: Record<string, any> = {}) {
    super();
    this.runtime = new Runtime(Object.assign(new Library(), builtins));
    this.module = this.runtime.module();
    // define a hidden module variable
    // this.module.variable(true).define("_module", [], () => this.module);

    console.log("--------------------------------------------");
    // define a hidden module variable for observed nodes
    this.redefineFromConfig(
      "_cell_nodes",
      "Nodes",
      ["Carbon", "observedIds"],
      (Carbon, observedIds) => {
        return new Nodes(Carbon, observedIds);
      },
    );
  }

  result(cellId: string) {
    return this.cells.get(cellId)?.result;
  }

  delete(cellId: string) {
    this.cells.delete(cellId);
  }

  printStats() {
    const vars = Array.from(this.runtime._variables).filter(
      // @ts-ignore
      (v) => v._observer.toString() !== "Symbol(no-observer)",
    );
    console.log(
      "Variables",
      vars.map((v) => v._name),
    );
  }

  observeNode(nodeId: string) {
    this.observedNodes.add(nodeId);
    this.redefine(
      "observedIds",
      "_observed_ids",
      `${JSON.stringify(Array.from(this.observedNodes))}`,
      "javascript",
      true,
    );
  }

  unobserveNode(nodeId: string) {
    this.observedNodes.delete(nodeId);
    this.redefine(
      "observedIds",
      "_observed_ids",
      `${JSON.stringify(Array.from(this.observedNodes))}`,
      "javascript",
      true,
    );
  }

  redefineFromConfig(cellId, name, deps: string[], definition: Function) {
    const cell = ActiveCell.fromConfig(this, cellId, name, deps, definition);
    this.define(cell);
  }

  // observe a node via a custom variable named `node_${nodeId}`
  redefineNode(nodeId: string) {
    console.log(
      "redefine",
      nodeId,
      "node_" + nodeId,
      `Carbon.store.get(${nodeId})`,
    );
    this.redefine(
      "node_" + nodeId,
      nodeId,
      `Carbon.store.get('${nodeId}')`,
      "javascript",
      true,
    );

    this.observeNode(nodeId);
  }

  redefine(
    name: string,
    cellId: string,
    code: string | Function,
    type: string,
    force: boolean = false,
  ) {
    // check if the code is the same as the cache code for the node
    // const cache = this.cache.get(cellId);
    // if (code === cache) return;
    // this.cache.set(cellId, code);

    const cell = this.cells.get(cellId);
    // for force update, delete the cell and redefine anyway
    if (
      !force &&
      cell &&
      cell.code === code &&
      cell.codeType === type &&
      !cell.error
    ) {
      // console.log("code is the same", cellId, code, cell);
      return;
    }

    if (code === "") {
      // invalidate old cell
      if (cell && cell.variable) {
        cell.delete();
      }

      this.cells.delete(cellId);
      this.printStats();
      this.emit("deleted:" + cellId, cell);
      return;
    }

    try {
      // find the cell id add create a variable
      const cell = ActiveCell.fromCode(this, name, cellId, code, type);
      if (!cell) {
        console.error("failed to create from code", cellId, code);
        const oldCell = this.cells.get(cellId);
        if (oldCell) {
          oldCell.delete();
        }
        this.cells.delete(cellId);
        this.emit("deleted:" + cellId, oldCell);
        return;
      }

      this.define(cell);
      this.printStats();
      return null;
    } catch (err) {
      console.error(err);
      this.emit("error:" + cellId, err);
      // if the cell is already defined, update the cell error
      if (cell) {
        cell.error = err;
        this.rejected(cell);
      }
      return err;
    }
  }

  // define a new cell, if old cell with same id exists redefine it
  private define(cell: ActiveCell) {
    const { id, name, inputs, definition } = cell;
    const before = this.cells.get(id);
    console.log(
      "%ccell",
      "background:green;color:white;",
      id,
      definition.toString(),
    );

    if (cell.name === "Nodes") {
      console.log("Nodes", cell);
    }
    // define a new variable
    if (before) {
      this.replace(before, cell);
    } else {
      this.defineFresh(cell);
    }

    this.cells.set(id, cell);

    // inform the cell is defined
    before?.emit("deleted:" + cell.id, cell);
    this.emit("defined:" + cell.id, cell);
  }

  onDefine(cellId: string, cb: (cell: ActiveCell) => void) {
    this.on("defined:" + cellId, cb);
  }

  offDefine(cellId: string, cb: (cell: ActiveCell) => void) {
    this.off("defined:" + cellId, cb);
  }

  onDelete(cellId: string, cb: (cell: ActiveCell) => void) {
    this.on("deleted:" + cellId, cb);
  }

  offDelete(cellId: string, cb: (cell: ActiveCell) => void) {
    this.off("deleted:" + cellId, cb);
  }

  onError(cellId: string, cb: (err: Error) => void) {
    this.on("error:" + cellId, cb);
  }

  offError(cellId: string, cb: (err: Error) => void) {
    this.off("error:" + cellId, cb);
  }

  onFulfilled(cellId: string, cb: (cell: ActiveCell) => void) {
    this.on(`fulfilled:${cellId}`, cb);
  }

  offFulfilled(cellId: string, cb: (cell: ActiveCell) => void) {
    this.off(`fulfilled:${cellId}`, cb);
  }

  onRejected(cellId: string, cb: (cell: ActiveCell) => void) {
    this.on(`rejected:${cellId}`, cb);
  }

  offRejected(cellId: string, cb: (cell: ActiveCell) => void) {
    this.off(`rejected:${cellId}`, cb);
  }

  onPending(cellId: string, cb: (cell: ActiveCell) => void) {
    this.on(`pending:${cellId}`, cb);
  }

  offPending(cellId: string, cb: (cell: ActiveCell) => void) {
    this.off(`pending:${cellId}`, cb);
  }

  private replace(before: ActiveCell, cell: ActiveCell) {
    // if before.name is different from cell.name
    if (
      before.name === null ||
      before.name === undefined ||
      before.name != cell.name ||
      before.codeType !== cell.codeType
    ) {
      const variable = this.defineFresh(cell);
      if (before.variable) {
        // NOTE: deleting the cell will also delete the variable
        before.delete(before.variable === variable);
      }
    } else if (before.name === cell.name) {
      // NOTE: as the name are the same, we can redefine the variable with the same name
      // internal Runtime will keep the same variable with all the references intact
      console.log("replacing", before.name, cell.name);
      // redefine the cell, will keep the same variable
      cell.variable = this.module.redefine(
        cell.name,
        cell.inputs,
        cell.definition,
      );
    }
  }

  private defineFresh(cell: ActiveCell) {
    const { id, name, inputs, definition } = cell;
    // console.log("define fresh", name, definition);
    cell.variable = this.module
      .variable({
        fulfilled: (value: any) => {
          if (cell.deleted) return;
          // console.log("FULFILLED", cell.codeType, cell.uniqId, cell.id, value);
          cell.result = value;
          if (isHtmlElement(value)) {
            // @ts-ignore
            cell.html = value.outerHTML;
          }
          cell.error = "";
          cell.emit("fulfilled", cell);

          // if the cell has is a viewOf operator create a new hidden cell to track the form value
          // console.log("cell.isViewOf()", cell.isViewOf(), cell);
          // if (cell.isViewOf()) {
          //   const name = cell.name?.replace("__view_", "");
          //
          //   const view = ActiveCell.fromCode(
          //     this,
          //     randomCellId(),
          //     `${name} = Generators.input(${cell.name})`,
          //   );
          //
          //   if (view) {
          //     cell.connectOutput(view);
          //     this.define(view);
          //   }
          // }

          this.fulfilled(cell);
          // console.log(
          //   "%cREADY",
          //   "background:teal;color:white;",
          //   `${name} => `,
          //   value,
          // );
        },
        rejected: (err: any) => {
          if (cell.deleted) return;
          // console.error("REJECTED", `${name} => `, err);
          cell.error = err;

          cell.emit("rejected", cell);
          this.rejected(cell);
        },
        pending: (status) => {
          if (cell.deleted) return;
          cell.emit("pending", cell);
          this.pending(cell);
        },
      })
      .define(name, inputs, definition);

    return cell.variable;
  }

  destroy() {
    console.log("destroy module");
  }

  private fulfilled(cell: ActiveCell) {
    this.emit(`fulfilled:${cell.id}`, cell);
  }

  private rejected(cell: ActiveCell) {
    this.emit(`rejected:${cell.id}`, cell);
  }

  private pending(cell: ActiveCell) {
    this.emit(`pending:${cell.id}`, cell);
  }

  cell(parentId: string) {
    return this.cells.get(parentId);
  }
}

interface CellProps {
  id: string;
  name: string;
  code: string;
  codeType: string;
  ast: any;
  inputs: string[];
  definition: Function;
  mod: ActiveCellRuntime;
}

let counter = 0;
export class ActiveCell extends EventEmitter {
  uniqId: number;
  // this is a cell id
  // NOTE: not the same as the variable id
  id: string;
  // this is the variable name in the module and visible code
  name: string;
  code: string;
  ast: any;
  inputs: string[];
  definition: Function;

  variable: Optional<Variable>;

  mod: ActiveCellRuntime;

  outputs: ActiveCell[] = [];

  result: any;
  error: any;

  html: string | undefined;
  codeType: string;

  deleted: boolean = false;

  static fromConfig(
    mod: ActiveCellRuntime,
    cellId: string,
    name,
    deps: string[],
    definition: Function,
  ) {
    return new ActiveCell({
      id: cellId,
      name: name,
      code: "",
      codeType: "javascript",
      ast: undefined,
      inputs: deps,
      definition: definition,
      mod,
    });
  }

  static fromCode(
    mod: ActiveCellRuntime,
    name: string,
    id: string,
    code: string | Function,
    type: string,
  ): Optional<ActiveCell> {
    try {
      if (isString(code) && type === "markdown") {
        const cellName = nextUnnamedCellName();
        const deps = ["md"];
        const definition = (md) => {
          return md`${code}`;
        };

        return new ActiveCell({
          id,
          name: cellName,
          code,
          codeType: type,
          ast: undefined,
          inputs: deps,
          definition: definition,
          mod,
        });
      }

      if (isString(code) && type === "html") {
        const cellName = nextUnnamedCellName();
        const deps = ["html"];
        const definition = (html) => {
          return html`${code}`;
        };

        return new ActiveCell({
          id,
          name: cellName,
          code,
          codeType: type,
          ast: undefined,
          inputs: deps,
          definition: definition,
          mod,
        });
      }

      if (isString(code) && type === "css") {
        const cellName = nextUnnamedCellName();
        const deps = ["html"];
        const definition = (html) => {
          return html`<style>
            ${code}
          </style>`;
        };

        return new ActiveCell({
          id,
          name: cellName,
          code,
          codeType: type,
          ast: undefined,
          inputs: deps,
          definition: definition,
          mod,
        });
      }

      const ast = parseCell(code);
      if (!ast) {
        console.error("ast not found", code);
        return undefined;
      }

      if (!ast.body) {
        console.error("ast body not found", ast);
        return undefined;
      }

      let cellName = name || peekId(code);
      // when the
      if (this.isViewOf(ast)) {
        cellName = viewCellName(cellName);
      }

      if (this.isIdentifier(ast) && this.hasNoId(ast)) {
      }

      if (!cellName) {
        cellName = nextUnnamedCellName();
      }

      const deps = ast.references.map((arg: any) => arg.name);
      const definition = isString(code)
        ? this.defFromAst(cellName, deps, ast, code)
        : code;

      if (!definition) {
        console.error("DEFINITION NOT FOUND", ast.body.type, ast);
        return undefined;
      }

      return new ActiveCell({
        id,
        name: cellName,
        code: code.toString(),
        codeType: type,
        ast,
        inputs: deps,
        definition: definition,
        mod,
      });
    } catch (err) {
      throw err;
    }
  }

  static isViewOf(ast: any): boolean {
    return ast?.id?.type === "ViewExpression";
  }

  static isIdentifier(ast: any): boolean {
    return ast?.body?.type === "Identifier";
  }

  static hasNoId(ast: any): boolean {
    return !!ast?.id;
  }

  static defFromAst(name, deps, ast: any, code: string): Optional<Function> {
    const { type, body } = ast;
    console.log(
      `%c${body.type}`,
      "color:white;background:#ffcc006e;font-weight:bold;",
      ast,
    );

    const createDefinition = factory[body.type];
    if (!createDefinition) {
      console.error("MISSING DEFINITION FACTORY FOR:", body.type);
      return undefined;
    }

    try {
      return createDefinition.bind(factory)(name, deps, ast, code);
    } catch (err) {
      console.error(err);
      throw err;
    }
  }

  constructor(props: CellProps) {
    super();
    this.id = props.id;
    this.name = props.name;
    this.code = props.code;
    this.codeType = props.codeType;
    this.ast = props.ast;
    this.inputs = props.inputs;
    this.definition = props.definition;
    this.mod = props.mod;
    this.uniqId = counter++;
  }

  // get the value of the cell variable
  async value() {
    try {
      return await this.variable?._promise;
    } catch (err) {
      return err?.toString();
    }
  }

  hasNoExplicitId(): boolean {
    return !this.ast?.id;
  }

  hasName(): boolean {
    return (
      !isUnnamedCell(this.name) &&
      !isViewCell(this.name) &&
      this.codeType === "javascript"
    );
  }

  isViewOf(): boolean {
    return this.ast?.id.type === "ViewExpression";
  }

  idName(): string {
    return this.ast?.id?.name;
  }

  connectOutput(cell: ActiveCell) {
    this.outputs.push(cell);
  }

  disconnectOutput(cell: ActiveCell) {
    const index = this.outputs.indexOf(cell);
    if (index > -1) {
      this.outputs.splice(index, 1);
    }
  }

  // delete removes the internal variable and outputs
  // deleting the variable may cause delayed dirty events.
  // to check if the promise result is for deleted cell, the cell is marked as deleted and the promise is ignored
  delete(deleteVariable: boolean = true) {
    console.log("DELETED", this.uniqId, this.name);
    this.mod.cells.delete(this.id);
    this.outputs.forEach((cell) => cell.delete());
    this.deleted = true;
    if (deleteVariable) {
      this.variable?.delete();
    }
  }

  isFulfilled() {
    return !!this.variable?._promise.done;
  }
}

// factory for creating variable definitions
const factory = {
  Literal(name: string, deps: string[], ast: any, code: string) {
    const { body } = ast;
    return () => body.value;
  },
  BlockStatement(name: string, deps: string[], ast: any, code: string) {
    const { body } = ast;
    const blockBody = code.slice(body.start + 1, body.end - 1);
    // no need to return the block statement as the return is within the block body
    return this.define(name, deps, `${blockBody}`, ast);
  },
  Identifier(name: string, deps: string[], ast: any, code: string) {
    return this.define(name, deps, `return ${ast.body.name}`, ast);
  },
  YieldExpression(name: string, deps: string[], ast: any, code: string) {
    return this.define(name, deps, `${code}`, ast);
  },
  ClassExpression(name: string, deps: string[], ast: any, code: string) {
    return this.define(name, deps, `return (${code})`, ast);
  },
  CallExpression(name: string, deps: string[], ast: any, code: string) {
    const { body } = ast;
    const fnBody = code.slice(body.start, body.end);
    return this.define(name, deps, `return (${fnBody})`);
  },
  ArrowFunctionExpression(
    name: string,
    deps: string[],
    ast: any,
    code: string,
  ) {
    return this.Expression(name, deps, ast, code);
  },
  FunctionExpression(name: string, deps: string[], ast: any, code: string) {
    return this.Expression(name, deps, ast, code);
  },
  BinaryExpression(name: string, deps: string[], ast: any, code: string) {
    this.Expression(name, deps, ast, code);
  },
  TaggedTemplateExpression(
    name: string,
    deps: string[],
    ast: any,
    code: string,
  ) {
    return this.Expression(name, deps, ast, code);
  },
  NewExpression(name: string, deps: string[], ast: any, code: string) {
    return this.Expression(name, deps, ast, code);
  },
  MemberExpression(name: string, deps: string[], ast: any, code: string) {
    return this.Expression(name, deps, ast, code);
  },
  ChainExpression(name: string, deps: string[], ast: any, code: string) {
    return this.Expression(name, deps, ast, code);
  },
  ArrayExpression(name: string, deps: string[], ast: any, code: string) {
    return this.Expression(name, deps, ast, code);
  },
  Expression(name: string, deps: string[], ast: any, code: string) {
    const { body } = ast;
    const blockBody = code.slice(body.start, body.end);
    return this.define(name, deps, `return ${blockBody}`, ast);
  },

  SequenceExpression(name: string, deps: string[], ast: any, code: string) {
    const { body } = ast;
    const { expressions } = body;
    const endNode = expressions[expressions.length - 1];
    const blockBody = code.slice(endNode.start, endNode.end);
    return this.define(name, deps, `return ${blockBody}`, ast);
  },

  // create a function definition combining the name, inputs and body
  define(name: string, inputs: string[], body: string, opts?: any) {
    const fnStr = `return ${opts?.async ? "async" : ""} function ${opts?.generator ? "*" : ""} ${!!name ? `_${name}` : ""} ( ${inputs.join(",")} ) {\n  ${body} \n} `;
    // console.log("factory defined =>", fnStr);
    return new Function(fnStr)();
  },
};
