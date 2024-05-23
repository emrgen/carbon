import {
  BeforePlugin,
  BlockSelection,
  Carbon,
  EventHandlerMap,
  Mark,
  Selection,
  State,
  Transaction,
} from "@emrgen/carbon-core";
import { PluginEmitter } from "../core/PluginEmitter";
import { PluginState } from "../core/PluginState";
import { Optional } from "@emrgen/types";

// add formatter commands to the CarbonCommands interface
declare module "@emrgen/carbon-core" {
  export interface Transaction {
    formatter: {
      bold: (selection?: Selection | BlockSelection) => Optional<Transaction>;
      italic: (selection?: Selection | BlockSelection) => Optional<Transaction>;
      underline: (selection?: Selection) => Optional<Transaction>;
      strike: (selection?: Selection) => Optional<Transaction>;
      code: (selection?: Selection) => Optional<Transaction>;
      link: (link: string, selection?: Selection) => Optional<Transaction>;
      subscript: (selection?: Selection) => Optional<Transaction>;
      superscript: (selection?: Selection) => Optional<Transaction>;
      color: (color: string, selection?: Selection) => Optional<Transaction>;
      background: (
        color: string,
        selection: Selection,
      ) => Optional<Transaction>;
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
        const { app } = e;
        const { selection, blockSelection } = app.state;
        if (!blockSelection.isEmpty) {
          throw new Error("Not implemented");
        } else if (selection.isExpanded) {
          e.event.preventDefault();
          e.stopPropagation();

          e.cmd.formatter.bold(selection)?.dispatch();
        }
      },
    };
  }

  bold(tr: Transaction, selection: Selection | BlockSelection) {
    tr.action.format(selection, Mark.BOLD);
  }

  italic(tr: Transaction, selection: Selection = tr.app.selection) {
    tr.action.format(selection, Mark.ITALIC);
  }

  underline(tr: Transaction, selection: Selection) {
    tr.action.format(selection, Mark.UNDERLINE);
  }

  strike(app: Carbon, tr: Transaction, selection: Selection) {
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
}
