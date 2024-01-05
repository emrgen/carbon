import {ActionOrigin, PinnedSelection, Slice} from "@emrgen/carbon-core";
import {Optional} from "@emrgen/types";

export class Runtime {
  origin: ActionOrigin = ActionOrigin.Unknown;
  clipboard: Slice = Slice.empty;
  mousedown: boolean = false;
  selecting: boolean = false;
  skipSelectionSync: boolean = false;
  selectionchange: boolean = false;
  selection: Optional<PinnedSelection>;
}
