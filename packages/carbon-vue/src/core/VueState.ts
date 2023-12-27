import {ActionOrigin, Draft, Node, NodeIdSet, NodeMap, PinnedSelection, State} from "@emrgen/carbon-core";
import {VueNodeMap} from "./VueNodeMap";
import {VueDraft} from "./VueDraft";
import {Optional} from "@emrgen/types";
import {each} from "lodash";

export class VueState implements State {
  content: Node;
  selection: PinnedSelection;
  updated: NodeIdSet;
  isContentChanged: boolean;
  isSelectionChanged: boolean;
  nodeMap: NodeMap;

  static create(content: Node, selection: PinnedSelection) {
    const state = new VueState(content, selection);

    content.all(n => {
      state.nodeMap.set(n.id, n)
      // state.changes.add(n.id);
    });

    console.log('VueState.create', state.nodeMap.size, state.updated.size);

    return state;
  }

  constructor(content: Node, selection: PinnedSelection) {
    this.content = content;
    this.selection = selection;
    this.nodeMap = new VueNodeMap();
    this.updated = new NodeIdSet();
    this.isContentChanged = true;
    this.isSelectionChanged = true;
  }

  activate(): State {
    return this
  }

  deactivate(): void {}

  produce(origin: ActionOrigin, fn: (state: Draft) => void): State {
    const draft = new VueDraft(this);
    return draft.produce(fn);
  }

  eq(state: State): boolean {
    return false;
  }

}
