import { parseCell, peekId } from "@observablehq/parser";
import { DefinitionFactory } from "./Definition";
import { Module } from "./Module";
import { UNDEFINED_VALUE, Variable } from "./Variable";
import { randomString } from "./x";

interface CellProps {
  id: string;
  name?: string;
  version?: number;
  code?: string;
  hash?: string;
  // fully qualified names of the dependencies with format: moduleId:variableName
  dependencies?: string[];
  definition?: Function;
  mutable?: boolean;
  view?: boolean;
  builtin?: boolean;
}

let cellCounter = 0;

export interface CellParseOptions {
  id?: string;
  name?: string;
  version?: number;
}

// Cell is a reactive unit of computation that can be defined and used in a module.
export class Cell {
  id: string;
  name: string;
  version: number;
  code: string;
  hash: string;
  dependencies: string[];
  definition: Function;
  view: boolean;
  mutable: boolean;
  builtin: boolean;

  static from(id: string, name: string, deps: string[], define: Function) {
    return Cell.create({
      id,
      name,
      dependencies: deps,
      definition: define,
    });
  }

  static create(props: CellProps) {
    return new Cell(props);
  }

  static noop(name: string) {}

  static hasName(cell: Cell) {
    const name = cell.name;
    // console.log("Checking cell name:", name, !name.startsWith("__unnamed__"));
    return name && !name.startsWith("__unnamed__") && !name.startsWith("__view__");
  }

  static undefinedName() {
    return `__unnamed__${randomString(10)}`;
  }

  // parse a cell definition and return a Cell instance
  static parse(definition: string, options?: CellParseOptions): Cell {
    const { name, version, id = randomString(10) } = options || {};
    let ast: any;
    try {
      ast = parseCell(definition);
    } catch (error) {
      // create a cell that throws an error when executed
      return Cell.from(id, name || Cell.undefinedName(), [], () => {
        throw error;
      });
    }

    // If the AST is not valid, return a cell that throws an error when executed
    if (!ast) {
      return Cell.from(id, name || Cell.undefinedName(), [], () => {
        throw new Error(`Invalid cell definition: ${definition}`);
      });
    }

    console.log(ast);
    let defBody = ast.body;

    if (!defBody) {
      return Cell.from(id, name || Cell.undefinedName(), [], () => {
        return "";
      });
    }

    let view = false;
    let cellName = name || peekId(definition);
    if (ast?.id?.type === "ViewExpression") {
      cellName = name ?? `__view__${++cellCounter}`;
      view = true;
    }

    let mutable = false;
    if (ast?.id?.type === "MutableExpression") {
      mutable = true;
    }

    if (!cellName) {
      cellName = name ?? `__unnamed__${++cellCounter}`;
    }

    const deps = ast.references.map((arg: any) => {
      if (arg.type === "MutableExpression") {
        definition = definition.replace(`mutable ${arg.id.name}`, `mutable_${arg.id.name}.value`);

        return `mutable_${arg.id.name}`;
      }

      return arg.name;
    });
    // .map((arg: any) => {
    //   return arg.name;
    // });

    ast = parseCell(definition);

    console.log(cellName, ast);

    const create = DefinitionFactory[ast.body.type];
    if (!create) {
      console.error("MISSING DEFINITION FACTORY FOR:", ast.body.type, DefinitionFactory);
      return Cell.from(id, cellName, deps, () => {
        throw new Error(`Unsupported cell definition type: ${ast.body.type}`);
      });
    }

    try {
      const fn = create.bind(DefinitionFactory)(name, deps, ast, definition);
      return Cell.create({
        id,
        version: version || 0,
        name: cellName,
        code: definition,
        dependencies: deps,
        definition: fn,
        mutable,
        view,
      });
    } catch (err) {
      console.error(err);
      throw err;
    }
  }

  constructor(props: CellProps) {
    const {
      id,
      name = Cell.undefinedName(),
      version = 0,
      code = randomString(5), // this is for convenience
      definition = () => UNDEFINED_VALUE,
      dependencies = [],
      builtin = false,
      mutable = false,
      view = false,
    } = props;
    this.id = id;
    this.name = name;
    this.version = version;
    this.code = code;
    this.dependencies = dependencies;
    this.definition = definition;
    this.mutable = mutable;
    this.view = view;
    this.builtin = builtin;
    this.hash = this.code
      ? generateHash(
          `${this.id}/${this.name}/${this.version}/${this.code}/${this.dependencies.join(",")}`,
        ).toString()
      : `hash_${randomString(10)}`;
  }

  // inject module id into the dependency names
  with(module: Module) {
    this.dependencies = this.dependencies.map((name) => {
      if (name.split(":").length === 1) {
        return Variable.fullName(module.id, name);
      } else {
        return name;
      }
    });

    return this;
  }

  eq(cell: Cell) {
    return this.hash === cell.hash;
  }
}

function generateHash(str: string) {
  let hash = 0;
  let i = 0;
  let chr = 0;
  if (str.length === 0) return hash;
  for (i = 0; i < str.length; i++) {
    chr = str.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0; // Convert to 32bit integer
  }

  return hash;
}
