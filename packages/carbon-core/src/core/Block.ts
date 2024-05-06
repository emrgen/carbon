import {Node, NodeId, Path, StateScope} from "@emrgen/carbon-core";
import {Optional} from "@emrgen/types";
import {Location} from "./Location";
import {isArray} from "lodash";

export class Block {
  static isText(node: Node) {
    return node.type.isText;
  }

  // static get(locator: Location | Path | NodeId): Optional<Node> {
  //
  //   const {scope, location} = pos;
  //   const map = StateScope.get(scope);
  //   if (!map) {
  //     return null;
  //   }
  //
  //   if (location instanceof NodeId) {
  //     return map.get(location);
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

// @ts-ignore
// window.Block = Block;
