import {ActionOrigin, Draft, Node, NodeIdSet, PinnedSelection, State} from "@emrgen/carbon-core";
import {SolidNodeMap} from "./NodeMap";
import {SolidDraft} from "./SolidDraft";

export class SolidState implements State {
  changes: NodeIdSet;
  content: Node;
  nodeMap: SolidNodeMap;
  selection: PinnedSelection;
  isContentChanged: boolean;
  isSelectionChanged: boolean;

  constructor(content: Node, selection: PinnedSelection) {
    this.content = content;
    this.selection = selection;
    this.nodeMap = new SolidNodeMap();
    this.changes = new NodeIdSet();

    this.isContentChanged = true;
    this.isSelectionChanged = true;
  }

  activate(): State {
    return this
  }

  deactivate(): void {}

  produce(origin: ActionOrigin, fn: (state: Draft) => void): State {
    const draft = new SolidDraft(this);
    return draft.produce(fn);
  }
}
