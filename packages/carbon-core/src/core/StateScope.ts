import { NodeBTree } from "./BTree";
import { NodeMap } from "./NodeMap";

const STATE_SCOPE: Map<Symbol, NodeMap> = new Map();

// this is a global state scope, used for storing global state of the app
export class StateScope {
  static get(scope: Symbol): NodeMap {
    let map = STATE_SCOPE.get(scope);
    if (!map) {
     throw new Error(`StateScope ${scope.toString()} not found`);
    }

    return map;
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

