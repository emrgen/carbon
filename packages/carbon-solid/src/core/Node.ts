import * as Core from '@emrgen/carbon-core';

export class Node extends Core.Node {
  static create<T extends Node>(this: new () => T): T {
    return new this();
  }

  // constructor(props: ) {
  //   super();
  // }
}
