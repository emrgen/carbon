import { InsertNodeAction, MoveNodeAction, RemoveNodeAction } from "@emrgen/carbon-core";
import { Draft } from "../Draft";

export interface CarbonAction {
  origin: ActionOrigin;

  type: ActionType;

  undoable?: boolean;

  execute(draft: Draft): void;

  inverse(origin?: ActionOrigin): CarbonAction;

  toJSON(): any;
}

// restrict the normalizer to only these actions so that we can easily reason about the normalizer
export type NormalizeAction = InsertNodeAction | RemoveNodeAction | MoveNodeAction;

// TxType is used to determine the type of transaction
export enum TxType {
  OneWay = "OneWay",
  TwoWay = "TwoWay",
  Undo = "Undo",
  Redo = "Redo",
}

// actions origin is used to determine the action execution context
export enum ActionOrigin {
  Unknown = "Unknown",
  Normalizer = "Normalizer", // command originated during normalization phase, these commands will not have any undo companion
  UserInput = "UserInput", // selection at the end of a user input, the selection will be synced after dom update
  NoSync = "NoSync", // selection at the end of a user input, the selection will be synced after dom update
  UserSelectionChange = "UserSelectionChange", // explicit user selection using arrow keys
  DomSelectionChange = "DomSelectionChange", // implicit user selection by up/down/mouse
  System = "System", // system generated commands (e.g. undo/redo for history plugin)
  Runtime = "Runtime", // runtime commands has meaning only during runtime
}

// ActionType is used to determine the type of action
export enum ActionType {
  move = "move",
  select = "select",
  insert = "insert",
  remove = "remove",
  insertFragment = "insertFragment",
  removeFragment = "removeFragment",
  props = "props",
  content = "content",
  rename = "rename",
  mark = "mark",
}
