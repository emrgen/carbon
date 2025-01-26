import { noop } from "lodash";
import { Module } from "./Module";
import { Variable } from "./Variable";
import { randomString } from "./x";

interface CellProps {
  id: string;
  name?: string;
  version?: number;
  code?: string;
  hash?: string;
  dependencies?: string[];
  definition?: Function;
  builtin?: boolean;
}

export class Cell {
  id: string;
  name: string;
  version: number;
  code: string;
  hash: string;
  dependencies: string[];
  definition: Function;
  builtin: boolean;

  static create(props: CellProps) {
    return new Cell(props);
  }

  static noop(name: string) {}

  static parse() {}

  static undefinedName() {
    return `unnamed_${randomString(10)}`;
  }

  constructor(props: CellProps) {
    const {
      id,
      name = Cell.undefinedName(),
      version = 0,
      code = "",
      definition = noop,
      dependencies = [],
      builtin = false,
    } = props;
    this.id = id;
    this.name = name;
    this.version = version;
    this.code = code;
    this.hash = this.code
      ? generateHash(`${this.id}/${this.name}/${this.version}/${this.code}`).toString()
      : `hash_${randomString(10)}`;
    this.dependencies = dependencies;
    this.definition = definition;
    this.builtin = builtin;
  }

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
