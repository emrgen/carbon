import { EventEmitter } from "events";
import { Module, Runtime, Variable } from "@observablehq/runtime";
import { parseCell, peekId } from "@observablehq/parser";
import { Optional } from "@emrgen/types";
import { nextUnnamedCellName } from "../utils";
import { isHtmlElement } from "../utils";
import { viewCellName } from "../utils";
import { isUnnamedCell } from "../utils";
import { isViewCell } from "../utils";
import { marked } from "marked";

//
export class CellModule extends EventEmitter {
  // cache the views of the cells
  runtime: Runtime;
  module: Module;

  // cellId -> Cell
  cells: Map<string, Cell> = new Map();

  constructor() {
    super();
    this.runtime = new Runtime();
    this.module = this.runtime.module();
    this.module.variable(true).define("_module", [], () => this.module);
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
    console.log(vars);
  }

  redefine(cellId: string, code: string, type: string) {
    // check if the code is the same as the cache code for the node
    // const cache = this.cache.get(cellId);
    // if (code === cache) return;
    // this.cache.set(cellId, code);

    const cell = this.cells.get(cellId);
    if (cell && cell.code === code && cell.codeType === type && !cell.error) {
      console.log("code is the same", cellId, code, cell);
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
      const cell = Cell.fromCode(this, cellId, code, type);
      if (!cell) {
        console.error("failed to create from code", cellId, code);
        return;
      }

      this.define(cell);
      this.printStats();
    } catch (err) {
      console.error(err);
      this.emit("error:" + cellId, err);
      // if the cell is already defined, update the cell error
      if (cell) {
        cell.error = err;
        this.rejected(cell);
      }
    }
  }

  // define a new cell, if old cell with same id exists redefine it
  private define(cell: Cell) {
    const { id, name, inputs, definition } = cell;
    const before = this.cells.get(id);
    console.log(
      "%ccell",
      "background:green;color:white;",
      id,
      definition.toString(),
    );

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

  onDefine(cellId: string, cb: (cell: Cell) => void) {
    this.on("defined:" + cellId, cb);
  }

  offDefine(cellId: string, cb: (cell: Cell) => void) {
    this.off("defined:" + cellId, cb);
  }

  onDelete(cellId: string, cb: (cell: Cell) => void) {
    this.on("deleted:" + cellId, cb);
  }

  offDelete(cellId: string, cb: (cell: Cell) => void) {
    this.off("deleted:" + cellId, cb);
  }

  onError(cellId: string, cb: (err: Error) => void) {
    this.on("error:" + cellId, cb);
  }

  offError(cellId: string, cb: (err: Error) => void) {
    this.off("error:" + cellId, cb);
  }

  onFulfilled(cellId: string, cb: (cell: Cell) => void) {
    this.on(`fulfilled:${cellId}`, cb);
  }

  offFulfilled(cellId: string, cb: (cell: Cell) => void) {
    this.off(`fulfilled:${cellId}`, cb);
  }

  onRejected(cellId: string, cb: (cell: Cell) => void) {
    this.on(`rejected:${cellId}`, cb);
  }

  offRejected(cellId: string, cb: (cell: Cell) => void) {
    this.off(`rejected:${cellId}`, cb);
  }

  onPending(cellId: string, cb: (cell: Cell) => void) {
    this.on(`pending:${cellId}`, cb);
  }

  offPending(cellId: string, cb: (cell: Cell) => void) {
    this.off(`pending:${cellId}`, cb);
  }

  private replace(before: Cell, cell: Cell) {
    // if before.name is different from cell.name
    if (
      before.name === null ||
      before.name === undefined ||
      before.name !== cell.name ||
      before.codeType !== cell.codeType
    ) {
      if (before.variable) {
        console.log("DELETED", before.uniqId, before.name);
        // NOTE: deleting the cell will also delete the variable
        before.delete();
      }
      this.defineFresh(cell);
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

  private defineFresh(cell: Cell) {
    const { id, name, inputs, definition } = cell;
    console.log("define fresh", name, definition);
    cell.variable = this.module
      .variable({
        fulfilled: (value: any) => {
          if (cell.deleted) return;
          console.log("FULFILLED", cell.codeType, cell.uniqId, cell.id, value);
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
          //   const view = Cell.fromCode(
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
          console.log(
            "%cREADY",
            "background:teal;color:white;",
            `${name} => `,
            value,
          );
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
  }

  destroy() {
    console.log("destroy module");
  }

  private fulfilled(cell: Cell) {
    this.emit(`fulfilled:${cell.id}`, cell);
  }

  private rejected(cell: Cell) {
    this.emit(`rejected:${cell.id}`, cell);
  }

  private pending(cell: Cell) {
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
  mod: CellModule;
}

let counter = 0;
export class Cell extends EventEmitter {
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

  mod: CellModule;

  outputs: Cell[] = [];

  result: any;
  error: any;

  html: string | undefined;
  codeType: string;

  deleted: boolean = false;

  static fromCode(
    mod: CellModule,
    id: string,
    code: string,
    type: string,
  ): Optional<Cell> {
    try {
      if (type === "markdown") {
        const cellName = nextUnnamedCellName();
        const deps = ["html"];
        const definition = (html) => {
          return html`${marked(code)}`;
        };

        return new Cell({
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

      if (type === "html") {
        const cellName = nextUnnamedCellName();
        const deps = ["html"];
        const definition = (html) => {
          return html`${code}`;
        };

        return new Cell({
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

      if (type === "css") {
        const cellName = nextUnnamedCellName();
        const deps = ["html"];
        const definition = (html) => {
          return html`<style>
            ${code}
          </style>`;
        };

        return new Cell({
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

      let cellName = peekId(code);
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
      const definition = this.defFromAst(cellName, deps, ast, code);

      if (!definition) {
        console.error("DEFINITION NOT FOUND", ast);
        return undefined;
      }

      return new Cell({
        id,
        name: cellName,
        code,
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

  connectOutput(cell: Cell) {
    this.outputs.push(cell);
  }

  disconnectOutput(cell: Cell) {
    const index = this.outputs.indexOf(cell);
    if (index > -1) {
      this.outputs.splice(index, 1);
    }
  }

  // delete removes the internal variable and outputs
  // deleting the variable may cause delayed dirty events.
  // to check if the promise result is for deleted cell, the cell is marked as deleted and the promise is ignored
  delete() {
    this.mod.cells.delete(this.id);
    this.variable?.delete();
    this.outputs.forEach((cell) => cell.delete());
    this.deleted = true;
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
    const { body } = ast;
    const fnBody = code.slice(body.start, body.end);
    return this.define(name, deps, `return (${fnBody})`);
  },
  FunctionExpression(name: string, deps: string[], ast: any, code: string) {
    const { body } = ast;
    const fnBody = code.slice(body.start, body.end);
    return this.define(name, deps, `return (${fnBody})`);
  },

  BinaryExpression(name: string, deps: string[], ast: any, code: string) {
    const { body } = ast;
    const fnBody = code.slice(body.start, body.end);
    return this.define(name, deps, `return (${fnBody})`);
  },
  BlockStatement(name: string, deps: string[], ast: any, code: string) {
    const { body } = ast;
    console.log("block statement", body, code);
    const blockBody = code.slice(body.start + 1, body.end - 1);
    // no need to return the block statement as the return is within the block body
    return this.define(name, deps, `${blockBody}`);
  },
  TaggedTemplateExpression(
    name: string,
    deps: string[],
    ast: any,
    code: string,
  ) {
    const { body } = ast;
    const tagBody = code.slice(body.start, body.end);
    return this.define(name, deps, `return (${tagBody})`);
  },
  Identifier(name: string, deps: string[], ast: any, code: string) {
    return this.define(name, deps, `return ${ast.body.name}`);
  },

  // create a function definition combining the name, inputs and body
  define(name: string, inputs: string[], body: string) {
    const fnStr = `return function ${!!name ? `_${name}` : ""} ( ${inputs.join(",")} ) {\n  ${body} \n} `;
    console.log("factory defined =>", fnStr);
    return new Function(fnStr)();
  },
};
