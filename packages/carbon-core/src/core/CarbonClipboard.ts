import { Fragment } from "./Fragment";

export class CarbonClipboard {
  fragment: Fragment;

  static default() {
    return new CarbonClipboard();
  }

  get isEmpty() {
    return this.fragment.isEmpty;
  }

  constructor() {
    this.fragment = Fragment.from([]);
  }

  setFragment(fragment: Fragment) {
    this.fragment = fragment;
  }

  clear() {
    this.fragment = Fragment.from([]);
  }

}
