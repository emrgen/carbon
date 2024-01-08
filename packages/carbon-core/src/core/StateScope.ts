import { NodeBTree } from "./BTree";
import { NodeMap } from "./NodeMap";

const STATE_SCOPE: Map<Symbol, NodeMap> = new Map();

const GLOBAL_SCOPE = Symbol("GLOBAL");

const SCOPES: Symbol[] = [GLOBAL_SCOPE];

// this is a global state scope, used for storing global state of the application
export class StateScope {
  // global scope acts as a default scope and bridge between all other scopes
  static GLOBAL = GLOBAL_SCOPE;

  static scope: Symbol = GLOBAL_SCOPE;

  get current() {
    return SCOPES[SCOPES.length - 1];
  }

  static set(scope: Symbol) {
    this.scope = scope;
  }

  static get(scope: Symbol = StateScope.scope): NodeMap {
    let map = STATE_SCOPE.get(scope);
    if (!map) {
     throw new Error(`StateScope ${scope.toString()} not found`);
    }

    return map;
  }

  // use this to temporarily override the state scope
  static with(scope: Symbol, map: NodeMap, fn: (map: NodeMap) => void) {
    const prev = STATE_SCOPE.get(scope);
    STATE_SCOPE.set(scope, map);
    fn(map);
    if (prev) {
      STATE_SCOPE.set(scope, prev);
    }
  }

  static put(scope: Symbol, map: NodeMap) {
    STATE_SCOPE.set(scope, map);
  }

  static has(scope: Symbol) {
    return STATE_SCOPE.has(scope);
  }

  static delete(scope: Symbol) {
    STATE_SCOPE.delete(scope);
  }
}

