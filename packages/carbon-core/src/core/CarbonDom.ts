import {Optional} from "@emrgen/types";
import {CarbonEditor} from "./CarbonEditor";

export class CarbonDom {
  _selection: Optional<Selection> = window.getSelection();

  get selection() {
    return this._selection ?? window.getSelection();
  }

  constructor(readonly app: CarbonEditor) {}
}
