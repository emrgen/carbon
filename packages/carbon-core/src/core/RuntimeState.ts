import { Optional } from "@emrgen/types";
import { ActionOrigin } from "./actions/index";
import { Slice } from "./Slice";
import { PinnedSelection } from "./PinnedSelection";
import { MarkSet } from "./Mark";

export class RuntimeState {
  origin: ActionOrigin = ActionOrigin.Unknown;
  clipboard: Slice = Slice.empty;
  mousedown: boolean = false;
  selecting: boolean = false;
  skipSelectionSync: boolean = false;
  selectionchange: boolean = false;
  selection: Optional<PinnedSelection>;
  marks: MarkSet = new MarkSet();
  windowSelection: Optional<Selection>;
}
