import { Slice } from "./Slice";

export class CarbonClipboard {
  slice: Slice;

  static default() {
    return new CarbonClipboard();
  }

  get isEmpty() {
    return this.slice.isEmpty;
  }

  constructor() {
    this.slice = Slice.empty
  }

  setSlice(slice: Slice) {
    this.slice = slice;
  }

  clear() {
    this.slice = Slice.empty;
  }

}
