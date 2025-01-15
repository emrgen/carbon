import { Optional } from "@emrgen/types";
import { ActionOrigin, TxType } from "./actions/types";
import { BlockSelection } from "./BlockSelection";
import { NodeIdSet } from "./BSet";
import { Draft } from "./Draft";
import { MarkSet } from "./Mark";
import { Node } from "./Node";
import { StateActions, StateChanges } from "./NodeChange";
import { NodeMap } from "./NodeMap";
import { PinnedSelection } from "./PinnedSelection";
import { PluginManager } from "./PluginManager";
import { Schema } from "./Schema";

export interface ProduceOpts {
  origin: ActionOrigin;
  type: TxType;
  pm: PluginManager;
  schema: Schema;
}

export interface State {
  previous: Optional<State>;
  scope: Symbol;
  content: Node;
  marks: MarkSet;
  selection: PinnedSelection;
  blockSelection: BlockSelection;
  nodeMap: NodeMap;
  // these are the nodes that need to be updated in the UI
  updated: NodeIdSet;
  contentUpdated: NodeIdSet;
  changes: StateChanges;
  actions: StateActions;

  isContentChanged: boolean;
  isSelectionChanged: boolean;
  isMarksChanged: boolean;
  isLargeContent: boolean;

  // try to create a new state or fail and return the previous state
  produce(fn: (state: Draft) => void, opts: ProduceOpts): State;

  // app informs the state about the usage of the state
  activate(): State;

  deactivate(): void;

  eq(state: State): boolean;
}
