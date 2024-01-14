import { NodeIdSet } from "./BSet";
import {ActionOrigin, TransactionType} from "./actions/types";
import { Node } from "./Node";
import { PinnedSelection } from "./PinnedSelection";
import { NodeMap } from "./NodeMap";
import {Draft} from "./Draft";
import {StateActions, StateChanges} from "./NodeChange";
import {BlockSelection} from "./BlockSelection";
import {PluginManager, Schema} from "@emrgen/carbon-core";

export interface ProduceOpts {
  origin: ActionOrigin,
  type: TransactionType,
  pm: PluginManager,
  schema: Schema,
}

export interface State {
  scope: Symbol;
  content: Node;
  selection: PinnedSelection;
  blockSelection: BlockSelection;
  nodeMap: NodeMap;
  // these are the nodes that need to be updated in the UI
  updated: NodeIdSet;
  changes: StateChanges;
  actions: StateActions;

  isContentChanged: boolean;
  isSelectionChanged: boolean;

  // try to create a new state or fail and return the previous state
  produce(fn: (state: Draft) => void, opts: ProduceOpts): State;
  // app informs the state about the usage of the state
  activate(): State;
  deactivate(): void;
  eq(state: State): boolean;
}
