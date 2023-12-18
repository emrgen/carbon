import { ActionOrigin, Slice } from "@emrgen/carbon-core";

export class CarbonRuntime {
  origin: ActionOrigin = ActionOrigin.Unknown;
  clipboard: Slice = Slice.empty;
}
