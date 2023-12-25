import * as Core from '@emrgen/carbon-core';
import {Optional} from "@emrgen/types";
import {identity, map} from "lodash";

export class Node extends Core.Node {
  static create<T extends Node>(this: new () => T): T {
    return new this();
  }

  // constructor(props: ) {
  //   super();
  // }

  // we don't need to clone the node
  clone(): Node {
    return this
  }

  // solid js states are mutable using signals
  // so we don't need to freeze the state
  freeze(): this {
    return this;
  }
}
