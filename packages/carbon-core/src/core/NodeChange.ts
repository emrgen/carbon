import { Optional } from "@emrgen/types";
import { NodeIdSet } from "./BSet";
import { PinnedSelection } from "./PinnedSelection";
import { SelectionEvent } from "./SelectionEvent";
import { PointedSelection } from "./PointedSelection";

export class StateChanges {
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
    diff.inserted = this.inserted;
    diff.updated = this.updated;
    diff.deleted = this.deleted;
    diff.moved = this.moved;
    diff.selected = this.selected.sub(other.selected);
    diff.activated = this.activated.sub(other.activated);
    diff.opened = this.opened.sub(other.opened);

    return diff;
  }

  get isDirty() {
    return this.isContentDirty || this.isNodeStateDirty || this.isClipboardDirty || this.isPropsDirty || this.isMarksDirty || this.isStylesDirty || this.isSelectionDirty;
  }

  get isContentDirty() {
    return this.inserted.size || this.updated.size || this.deleted.size || this.moved.size;
  }

  get isNodeStateDirty() {
      return this.selected.size || this.activated.size || this.opened.size;
  }

  get isSelectionDirty() {
    return !!this.selection;
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
