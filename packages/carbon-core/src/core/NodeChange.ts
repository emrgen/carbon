import { Optional } from "@emrgen/types";
import { NodeIdSet } from "./BSet";
import { PinnedSelection } from "./PinnedSelection";
import { PointedSelection } from "./PointedSelection";

export class StateChanges {
  render: NodeIdSet = new NodeIdSet();
  changed: NodeIdSet = new NodeIdSet();
  renamed: NodeIdSet = new NodeIdSet();
  inserted: NodeIdSet = new NodeIdSet();
  updated: NodeIdSet = new NodeIdSet();
  deleted: NodeIdSet = new NodeIdSet();
  moved: NodeIdSet = new NodeIdSet();
  selected: NodeIdSet = new NodeIdSet();
  activated: NodeIdSet = new NodeIdSet();
  opened: NodeIdSet = new NodeIdSet();
  clipboard: NodeIdSet = new NodeIdSet();
  updatedProps: NodeIdSet = new NodeIdSet();
  updatedMarks: NodeIdSet = new NodeIdSet();
  updatedStyles: NodeIdSet = new NodeIdSet();
  selection: Optional<PointedSelection> = null;
  pendingSelections: PinnedSelection[] = [];

  diff(other: StateChanges): StateChanges {
    const diff = new StateChanges();
    diff.render = this.render;
    diff.changed = this.changed;
    diff.inserted = this.inserted;
    diff.updated = this.updated;
    diff.deleted = this.deleted;
    diff.moved = this.moved;
    diff.changed = this.changed.sub(other.changed);
    diff.selected = this.selected.sub(other.selected);
    diff.activated = this.activated.sub(other.activated);
    diff.opened = this.opened.sub(other.opened);

    return diff;
  }

  get isDirty() {
    return this.isContentDirty || this.isSelectionDirty;
  }

  get isContentDirty() {
    return this.changed.size
  }

  get isSelectionDirty() {
    return !!this.selection;
  }

  get isNodeStateDirty() {
      return this.selected.size || this.activated.size || this.opened.size;
  }

  get isClipboardDirty() {
    return this.clipboard.size
  }

  get isPropsDirty() {
    return this.updatedProps.size;
  }

  get isMarksDirty() {
    return this.updatedMarks.size;
  }

  get isStylesDirty() {
    return this.updatedStyles.size;
  }

  freeze() {
    this.render.freeze();
    this.renamed.freeze();
    this.changed.freeze();
    this.inserted.freeze();
    this.updated.freeze();
    this.deleted.freeze();
    this.moved.freeze();
    this.selected.freeze();
    this.activated.freeze();
    this.opened.freeze();
    this.clipboard.freeze();
    this.updatedProps.freeze();
    this.updatedMarks.freeze();
    this.updatedStyles.freeze();

    Object.freeze(this);

    return this;
  }

  clone() {
    const clone = new StateChanges();
    clone.render = this.render.clone();
    clone.renamed = this.renamed.clone();
    clone.changed = this.changed.clone();
    clone.inserted = this.inserted.clone();
    clone.updated = this.updated.clone();
    clone.deleted = this.deleted.clone();
    clone.moved = this.moved.clone();
    clone.selected = this.selected.clone();
    clone.activated = this.activated.clone();
    clone.opened = this.opened.clone();
    clone.clipboard = this.clipboard.clone();
    clone.updatedProps = this.updatedProps.clone();
    clone.updatedMarks = this.updatedMarks.clone();
    clone.updatedStyles = this.updatedStyles.clone();
    clone.selection = this.selection;

    return clone;
  }

  toJSON() {
    return {
      renamed: this.renamed.toJSON(),
      changed: this.changed.toJSON(),
      inserted: this.inserted.toJSON(),
      updated: this.updated.toJSON(),
      deleted: this.deleted.toJSON(),
      moved: this.moved.toJSON(),
      selected: this.selected.toJSON(),
      activated: this.activated.toJSON(),
      opened: this.opened.toJSON(),
      clipboard: this.clipboard.toJSON(),
      updatedProps: this.updatedProps.toJSON(),
      updatedMarks: this.updatedMarks.toJSON(),
      updatedStyles: this.updatedStyles.toJSON(),
      selection: this.selection?.toJSON(),
    }
  }

}
