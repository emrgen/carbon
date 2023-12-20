import { Carbon, CarbonPlugin, PinnedSelection, PointedSelection, Selection, Transaction } from "@emrgen/carbon-core";
import { Optional } from "@emrgen/types";
import { MarkSet } from "../core/Mark";


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

    format: {
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

  name = 'format';

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

  bold(tr: Transaction, selection: Selection = tr.app.selection) {
    console.log('bold', selection.toString())
  }

  italic(tr: Transaction, selection: Selection = tr.app.selection) {
    console.log('italic')
  }

  underline(tr: Transaction, selection: Selection) {
    console.log('underline')
  }

  strike(app: Carbon, tr: Transaction, selection: Selection) {
    console.log('strike')
  }

  code(tr: Transaction, selection: Selection) {
    console.log('code')
  }

  link(tr: Transaction, link: string, selection: Selection) {
    console.log('link')
  }

  subscript(tr: Transaction, selection: Selection) {
    console.log('subscript')
  }

  superscript(tr: Transaction, selection: Selection) {
    console.log('superscript')
  }

  color(tr: Transaction, color: string, selection: Selection) {
    console.log('color')
  }

  background(tr: Transaction, color: string, selection: Selection) {
    console.log('background')
  }
}
