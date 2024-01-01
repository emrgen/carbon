import { MarkSet } from "@emrgen/carbon-core";
import { Optional } from "@emrgen/types";
import { NodeIdSet } from "./BSet";
import { ActionOrigin } from "./actions/types";
import { Node } from "./Node";
import { PinnedSelection } from "./PinnedSelection";
import { NodeMap } from "./NodeMap";
import {Draft} from "./Draft";
import {StateChanges} from "./NodeChange";

export interface State {
  scope: Symbol;
  content: Node;
  selection: PinnedSelection;
  nodeMap: NodeMap;
  updated: NodeIdSet;
  changes: StateChanges;

  isContentChanged: boolean;
  isSelectionChanged: boolean;

  // try to create a new state or fail and return the previous state
  produce(origin: ActionOrigin, fn: (state: Draft) => void): State;
  // app informs the state about the usage of the state
  activate(): State;
  deactivate(): void;
  eq(state: State): boolean;
}
