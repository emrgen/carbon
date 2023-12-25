import { Node } from './Node';
import * as Core from '@emrgen/carbon-core';

export class NodeFactory extends Core.NodeFactory {
  static create<T extends Node>(this: new () => T): T {
    return new this();
  }
}
