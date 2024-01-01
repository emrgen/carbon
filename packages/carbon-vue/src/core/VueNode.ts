import {Node, TraverseOptions} from "@emrgen/carbon-core";
import {With} from "@emrgen/types";

export class VueNode extends Node {

  override each(fn: With<Node>, opts: Partial<TraverseOptions> = {}) {
    for (let i = 0; i < this.content.size; i++) {
      const child = this.content.child(i)
      if (!child) continue;
      fn(child);
    }
  }
}
