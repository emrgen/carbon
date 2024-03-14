import {
  Carbon,
  CarbonPlugin,
  Mark,
  Selection, State,
  Transaction
} from "@emrgen/carbon-core";
import {PluginEmitter} from "../core/PluginEmitter";
import {PluginState} from "../core/PluginState";

// add formatter commands to the CarbonCommands interface
declare module '@emrgen/carbon-core' {
  export interface Transaction {
    bold(selection: Selection): Transaction;
    italic(selection: Selection): Transaction;
    underline(selection: Selection): Transaction;
    strike(selection: Selection): Transaction;
    code(selection: Selection): Transaction;
    link(link: string, selection: Selection): Transaction;
    subscript(selection: Selection): Transaction;
    superscript(selection: Selection): Transaction;
    color(color: string, selection: Selection): Transaction;
    background(color: string, selection: Selection): Transaction;

    formatter: {
      bold: (selection?: Selection) => Transaction,
      italic: (selection?: Selection) => Transaction,
      underline: (selection?: Selection) => Transaction,
      strike: (selection?: Selection) => Transaction,
      code: (selection?: Selection) => Transaction,
      link: (link: string, selection?: Selection) => Transaction,
      subscript: (selection?: Selection) => Transaction,
      superscript: (selection?: Selection) => Transaction,
      color: (color: string, selection?: Selection) => Transaction,
      background: (color: string, selection: Selection) => Transaction,
    }
  }
}

export class FormatterPlugin extends CarbonPlugin {

  name = 'formatter';

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
    }
  }

  constructor() {
    super();

    this.onChanged = this.onChanged.bind(this);
  }

  init(app:Carbon, bus:PluginEmitter, state: PluginState) {
    super.init(app, bus, state);
    app.on('changed', this.onChanged);
  }

  destroy(app: Carbon) {
    super.destroy(app);
    app.off('changed', this.onChanged);
  }

  onChanged(state: State) {
    const {selection} = state
    if (selection.isCollapsed && !selection.isInvalid) {
      const {head} = selection;
      // console.log('Save marks from node', head.node)
    }
  }

  bold(tr: Transaction, selection = tr.app.selection) {
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

  link(tr: Transaction, selection: Selection, link: string = '#') {
    tr.action.format(selection, Mark.link(link));
  }

  subscript(tr: Transaction, selection: Selection) {
    tr.action.format(selection, Mark.SUBSCRIPT);
  }

  superscript(tr: Transaction, selection: Selection) {
    tr.action.format(selection, Mark.SUPERSCRIPT);
  }

  color(tr: Transaction, selection: Selection, color = '#aaa') {
    tr.action.format(selection, Mark.color(color));
  }

  background(tr: Transaction, selection: Selection, color = '#eee') {
    tr.action.format(selection, Mark.background(color));
  }

}
