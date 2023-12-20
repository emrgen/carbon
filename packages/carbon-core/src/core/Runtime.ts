import { ActionOrigin, Slice } from "@emrgen/carbon-core";

export class Runtime {
  origin: ActionOrigin = ActionOrigin.Unknown;
  clipboard: Slice = Slice.empty;
}
