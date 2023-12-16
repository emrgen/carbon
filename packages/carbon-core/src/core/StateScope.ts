import { NodeBTree } from "./BTree";
import { NodeMap } from "./NodeMap";

const STATE_SCOPE: Map<string, NodeMap> = new Map();

// this is a global state scope, used for storing global state of the app
export class StateScope {
  static get(scope: Symbol): NodeMap {
    let map = STATE_SCOPE.get(scope.toString());
    if (!map) {
     throw new Error(`StateScope ${scope.toString()} not found`);
    }

    return map;
  }

  static set(scope: Symbol, map: NodeMap) {
    STATE_SCOPE.set(scope.toString(), map);
  }

  static has(scope: Symbol) {
    return STATE_SCOPE.has(scope.toString());
  }

  static delete(name: string) {
    STATE_SCOPE.delete(name);
  }
}

