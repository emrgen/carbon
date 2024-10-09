import { Optional } from "@emrgen/types";
import { Carbon } from "./Carbon";

export class CarbonDom {
  _selection: Optional<Selection> = window.getSelection();

  get selection() {
    return this._selection ?? window.getSelection();
  }

  constructor(readonly app: Carbon) {}
}
