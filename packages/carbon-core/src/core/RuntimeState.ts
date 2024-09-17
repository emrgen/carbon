import {
  ActionOrigin,
  MarkSet,
  PinnedSelection,
  Slice,
} from "@emrgen/carbon-core";
import { Optional } from "@emrgen/types";

export class RuntimeState {
  origin: ActionOrigin = ActionOrigin.Unknown;
  clipboard: Slice = Slice.empty;
  mousedown: boolean = false;
  selecting: boolean = false;
  skipSelectionSync: boolean = false;
  selectionchange: boolean = false;
  selection: Optional<PinnedSelection>;
  marks: MarkSet = new MarkSet();
}
