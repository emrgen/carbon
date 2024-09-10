import {
  BeforePlugin,
  EventContext,
  EventHandlerMap,
  Mark,
  Node,
  PinnedSelection,
  preventAndStopCtx,
  Transaction,
} from "@emrgen/carbon-core";
import { Optional } from "@emrgen/types";

declare module "@emrgen/carbon-core" {
  export interface Transaction {
    marks: {
      toggle(mark: Mark): Optional<Transaction>;
    };
  }

  export interface Service {
    marks: {
      get(node: Node, offset: number): Mark[];
    };
  }
}

declare module "@emrgen/carbon-core" {
  interface Transaction {
    collapsible: {
      split(selection: PinnedSelection): Transaction;
      enter(selection: PinnedSelection): Transaction;
      expand(node: Node): Transaction;
      collapse(node: Node): Transaction;
      toggle(node: Node, path?: string): Transaction;
    };
  }
}

export class MarkPlugin extends BeforePlugin {
  name = "marks";

  override commands(): Record<string, Function> {
    return {
      toggle: this.toggle,
    };
  }

  toggle(tr: Transaction, mark: Mark) {
    if (tr.state.marks.has(mark)) {
      return tr.Mark("remove", mark);
    } else {
      return tr.Mark("add", mark);
    }
  }

  override keydown(): EventHandlerMap {
    return {
      "ctrl+b": (e) => this.toggleMark(e)(Mark.BOLD),
      "ctrl+i": (e) => this.toggleMark(e)(Mark.ITALIC),
      "ctrl+u": (e) => this.toggleMark(e)(Mark.UNDERLINE),
      "ctrl+shift+s": (e) => this.toggleMark(e)(Mark.STRIKE),
      "ctrl+e": (e) => this.toggleMark(e)(Mark.CODE),
    };
  }

  toggleMark(e: EventContext<any>) {
    return (mark: Mark) => {
      preventAndStopCtx(e);
      e.service.all();

      e.cmd.marks.toggle(mark)?.Dispatch();
    };
  }
}
