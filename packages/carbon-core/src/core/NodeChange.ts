import { Optional } from "@emrgen/types";
import { NodeIdSet } from "./BSet";
import { PinnedSelection } from "./PinnedSelection";
import { PointedSelection } from "./PointedSelection";
import { Slice } from "@emrgen/carbon-core";

export class StateChanges {
  // this nodes will be rendered
  render: NodeIdSet = new NodeIdSet();
  // changed nodes will be rebuilt
  changed: NodeIdSet = new NodeIdSet();
  renamed: NodeIdSet = new NodeIdSet();
  inserted: NodeIdSet = new NodeIdSet();
  updated: NodeIdSet = new NodeIdSet();
  deleted: NodeIdSet = new NodeIdSet();
  moved: NodeIdSet = new NodeIdSet();

  state: NodeIdSet = new NodeIdSet();
  selected: NodeIdSet = new NodeIdSet();
  activated: NodeIdSet = new NodeIdSet();
  opened: NodeIdSet = new NodeIdSet();
  props: NodeIdSet = new NodeIdSet();

  clipboard: Slice = Slice.empty;
  updatedProps: NodeIdSet = new NodeIdSet();
  updatedMarks: NodeIdSet = new NodeIdSet();
  updatedStyles: NodeIdSet = new NodeIdSet();
  selection: Optional<PointedSelection> = null;

  diff(other: StateChanges): StateChanges {
    const diff = new StateChanges();
    diff.render = this.render;
    diff.changed = this.changed;
    diff.inserted = this.inserted;
    diff.updated = this.updated;
    diff.deleted = this.deleted;
    diff.moved = this.moved;
    diff.changed = this.changed;
    diff.state = this.state;
    diff.selected = this.selected;
    diff.activated = this.activated;
    diff.opened = this.opened;
    diff.props = this.props;
    diff.clipboard = this.clipboard;
    diff.updatedProps = this.updatedProps;

    return diff;
  }

  get isDirty() {
    return this.isContentDirty || this.isSelectionDirty
  }

  get isContentDirty() {
    return this.changed.size
  }

  get isSelectionDirty() {
    return !!this.selection?.isInline
  }

  get isNodeStateDirty() {
      return this.state.size;
  }

  get isLocalStateDirty() {
      return this.moved.size || this.deleted.size || this.inserted.size || this.updated.size || this.renamed.size || this.props.size;
  }

  get isClipboardDirty() {
    return this.clipboard.isEmpty
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
    this.state.freeze();
    this.selected.freeze();
    this.activated.freeze();
    this.opened.freeze();
    this.props.freeze();
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
    clone.state = this.state.clone();
    clone.props = this.props.clone();
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
      state: this.state.toJSON(),
      selected: this.selected.toJSON(),
      activated: this.activated.toJSON(),
      opened: this.opened.toJSON(),
      attrs: this.props.toJSON(),
      clipboard: this.clipboard.toJSON(),
      updatedProps: this.updatedProps.toJSON(),
      updatedMarks: this.updatedMarks.toJSON(),
      updatedStyles: this.updatedStyles.toJSON(),
      selection: this.selection?.toJSON(),
    }
  }

}
