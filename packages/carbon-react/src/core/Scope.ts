import {NodeMap} from "@emrgen/carbon-core";


const STATE_SCOPE: Map<Symbol, NodeMap> = new Map();

// this is a global state scope, used for storing global state of the react
export class Scope {
  static get(scope: Symbol): NodeMap {
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

  static set(scope: Symbol, map: NodeMap) {
    STATE_SCOPE.set(scope, map);
  }

  static has(scope: Symbol) {
    return STATE_SCOPE.has(scope);
  }

  static delete(scope: Symbol) {
    STATE_SCOPE.delete(scope);
  }
}

