import {
  ActionOrigin,
  BeforePlugin,
  BlockSelection,
  Carbon,
  EventContext,
  EventHandlerMap,
  Mark,
  PinnedSelection,
  preventAndStopCtx,
  Selection,
  State,
  Transaction,
} from "@emrgen/carbon-core";
import { PluginEmitter } from "../core/index";
import { PluginState } from "../core/index";
import { Optional, With } from "@emrgen/types";

// add formatter commands to the CarbonCommands interface
declare module "@emrgen/carbon-core" {
  export interface Transaction {
    formatter: {
      bold: (selection?: Selection | BlockSelection) => Optional<Transaction>;
      italic: (selection?: Selection | BlockSelection) => Optional<Transaction>;
      underline: (
        selection?: Selection | BlockSelection,
      ) => Optional<Transaction>;
      strike: (selection?: Selection | BlockSelection) => Optional<Transaction>;
      code: (selection?: Selection | BlockSelection) => Optional<Transaction>;
      link: (link: string, selection?: Selection) => Optional<Transaction>;
      subscript: (
        selection?: Selection | BlockSelection,
      ) => Optional<Transaction>;
      superscript: (
        selection?: Selection | BlockSelection,
      ) => Optional<Transaction>;
      color: (
        color: string,
        selection?: Selection | BlockSelection,
      ) => Optional<Transaction>;
      background: (
        color: string,
        selection: Selection | BlockSelection,
      ) => Optional<Transaction>;
      toggle(mark: Mark): Optional<Transaction>;
      remove(mark: Mark, exact?: boolean): Optional<Transaction>;
    };
  }
}

export class FormatterPlugin extends BeforePlugin {
  name = "formatter";

  commands(): Record<string, Function> {
    return {
      bold: this.bold,
      italic: this.italic,
      underline: this.underline,
      strike: this.strike,
      code: this.code,
      link: this.link,
      subscript: this.subscript,
      superscript: this.superscript,
      color: this.color,
      background: this.background,
      toggle: this.toggle,
      remove: this.remove,
    };
  }

  constructor() {
    super();

    this.onChanged = this.onChanged.bind(this);
  }

  override init(app: Carbon, bus: PluginEmitter, state: PluginState) {
    super.init(app, bus, state);
    app.on("changed", this.onChanged);
  }

  override destroy(app: Carbon) {
    super.destroy(app);
    app.off("changed", this.onChanged);
  }

  onChanged(state: State) {
    const { selection } = state;
    if (selection.isCollapsed && !selection.isInvalid) {
      const { head } = selection;
      // console.log('Save marks from node', head.node)
    }
  }

  keydown(): EventHandlerMap {
    return {
      "ctrl+b": (e) => {
        this.toggleMark(e, (cmd, selection) => cmd.formatter.bold(selection));
      },
      "ctrl+i": (e) => {
        this.toggleMark(e, (cmd, selection) => cmd.formatter.italic(selection));
      },
      "ctrl+u": (e) => {
        this.toggleMark(e, (cmd, selection) =>
          cmd.formatter.underline(selection),
        );
      },
      "ctrl+shift+s": (e) => {
        this.toggleMark(e, (cmd, selection) => cmd.formatter.strike(selection));
      },
      "ctrl+e": (e) => {
        this.toggleMark(e, (cmd, selection) => cmd.formatter.code(selection));
      },
    };
  }

  toggleMark(
    ctx: EventContext<any>,
    fn: With<Transaction, Selection | BlockSelection>,
  ) {
    const { app, cmd } = ctx;
    const { selection, blockSelection } = app.state;

    if (selection.isCollapsed && blockSelection.isEmpty) {
      return;
    }

    preventAndStopCtx(ctx);
    fn(cmd, blockSelection.isEmpty ? selection : blockSelection);
    const { head, tail } = selection;
    const after = PinnedSelection.create(
      tail.down().node.isZero ? tail : tail.unfocused(),
      head.down().node.isZero ? head : head.unfocused(),
    );
    cmd?.select(after)?.dispatch();
  }

  bold(tr: Transaction, selection: Selection | BlockSelection) {
    tr.action.format(selection, Mark.BOLD);
  }

  italic(tr: Transaction, selection: Selection | BlockSelection) {
    tr.action.format(selection, Mark.ITALIC);
  }

  underline(tr: Transaction, selection: Selection) {
    tr.action.format(selection, Mark.UNDERLINE);
  }

  strike(tr: Transaction, selection: Selection) {
    tr.action.format(selection, Mark.STRIKE);
  }

  code(tr: Transaction, selection: Selection) {
    tr.action.format(selection, Mark.CODE);
  }

  link(tr: Transaction, selection: Selection, link: string = "#") {
    tr.action.format(selection, Mark.link(link));
  }

  subscript(tr: Transaction, selection: Selection) {
    tr.action.format(selection, Mark.SUBSCRIPT);
  }

  superscript(tr: Transaction, selection: Selection) {
    tr.action.format(selection, Mark.SUPERSCRIPT);
  }

  color(tr: Transaction, selection: Selection, color = "#aaa") {
    tr.action.format(selection, Mark.color(color));
  }

  background(tr: Transaction, selection: Selection, color = "#eee") {
    tr.action.format(selection, Mark.background(color));
  }

  toggle(tr: Transaction, mark: Mark) {
    const { selection, blockSelection } = tr.state;
    if (blockSelection.isEmpty) {
      return tr.action
        .format(selection, mark)
        .select(selection, ActionOrigin.UserInput);
    } else {
      return tr.action.format(blockSelection, mark);
    }
  }

  remove(tr: Transaction, mark: Mark, exact = false) {
    const { selection, blockSelection } = tr.state;
    if (blockSelection.isEmpty) {
      return tr.transform
        ?.removeMark(selection, mark)
        ?.select(selection, ActionOrigin.UserInput);
    } else {
      return tr.transform.removeMark(blockSelection, mark);
    }
  }
}
