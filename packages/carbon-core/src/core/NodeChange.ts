import { Optional } from "@emrgen/types";
import { NodeIdSet } from "./BSet";
import { PinnedSelection } from "./PinnedSelection";
import { PointedSelection } from "./PointedSelection";
import { Slice } from "@emrgen/carbon-core";

export class StateChanges {
  // this nodes will be rendered
  // changed nodes will be rebuilt in the next render cycle
  changed: NodeIdSet = new NodeIdSet();

  selection: Optional<PointedSelection> = null;

  get isDirty() {
    return this.isContentDirty || this.isSelectionDirty
  }

  get isContentDirty() {
    return this.changed.size
  }

  get isSelectionDirty() {
    return !!this.selection?.isInline
  }

  freeze() {
    this.changed.freeze();
    this.selection?.freeze();

    Object.freeze(this);

    return this;
  }

  clone() {
    const clone = new StateChanges();
    clone.changed = this.changed.clone();
    clone.selection = this.selection?.clone()

    return clone;
  }

  toJSON() {
    return {
      changed: this.changed.toJSON(),
      selection: this.selection?.toJSON(),
    }
  }

}
