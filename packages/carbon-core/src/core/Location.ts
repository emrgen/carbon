import {Node, NodeId, Path, StateScope} from "@emrgen/carbon-core";
import {Optional} from "@emrgen/types";
import {Block} from "./Block";
import {isArray} from "lodash";

export class Location {
  constructor(readonly scope: Symbol, readonly location: Path | NodeId) {}

  // use global scope to get the node
  // get node(): Optional<Node> {
  //   const {scope, location} = this;
  //   const map = StateScope.get(scope);
  //   if (!map) {
  //     return null;
  //   }
  //
  //   if (location instanceof NodeId) {
  //     return Block.get(this);
  //   }
  //
  //   if (isArray(location)) {
  //     return Block.at(location);
  //   }
  //
  //   return null;
  // }
  //
  // static at(path: Path) : Optional<Node> {
  //   const map = StateScope.get();
  //   if (!map) {
  //     return null;
  //   }
  //
  //   let node = map.get(NodeId.ROOT);
  //   for (let i = 0; i < path.length; i++) {
  //     if (!node) {
  //       return null;
  //     }
  //     node = node.child(path[i]);
  //   }
  //
  //   return node
  // }
}
