import { NodeBTree } from "./BTree";
import { NodeMap } from "./NodeMap";

const STATE_SCOPE: Map<string, NodeMap> = new Map();

// this is a global state scope, used for storing global state of the app
export class StateScope {
  static get(name: string): NodeMap {
    let scope = STATE_SCOPE.get(name);
    if (!scope) {
     throw new Error(`StateScope ${name} not found`);
    }

    return scope;
  }

  static set(name: string, scope: NodeMap) {
    STATE_SCOPE.set(name, scope);
  }

  static has(name: string) {
    return STATE_SCOPE.has(name);
  }

  static delete(name: string) {
    STATE_SCOPE.delete(name);
  }
}

