import { Carbon, CarbonPlugin, Transaction } from "@emrgen/carbon-core";
import { Optional } from "@emrgen/types";
import { MarkSet } from "../core/Mark";


// add formatter commands to the CarbonCommands interface
declare module '@emrgen/carbon-core' {
  export interface Transaction {
    format: {
      bold: (node: Node, start: number, end: number) => Optional<Transaction>;
      italic: (node: Node, start: number, end: number) => Optional<Transaction>;
      underline: (node: Node, start: number, end: number) => Optional<Transaction>;
      strike: (node: Node, start: number, end: number) => Optional<Transaction>;
      code: (node: Node, start: number, end: number) => Optional<Transaction>;
      link: (node: Node, start: number, end: number) => Optional<Transaction>;
      subscript: (node: Node, start: number, end: number) => Optional<Transaction>;
      superscript: (node: Node, start: number, end: number) => Optional<Transaction>;
      color: (node: Node, start: number, end: number, color: string) => Optional<Transaction>;
      background: (node: Node, start: number, end: number, color: string) => Optional<Transaction>;
      activeMarks: () => MarkSet;
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
      activeMarks: this.activeMarks
    }
  }

  // a list of marks that are currently active
  activeMarks(app: Carbon) {
  }

  bold(app: Carbon) {
    console.log('bold')
  }

  italic(app: Carbon) {
    console.log('italic')
  }

  underline(app: Carbon) {
    console.log('underline')
  }

  strike(app: Carbon) {
    console.log('strike')
  }

  code(app: Carbon) {
    console.log('code')
  }

  link(app: Carbon) {
    console.log('link')
  }

  subscript(app: Carbon) {
    console.log('subscript')
  }

  superscript(app: Carbon) {
    console.log('superscript')
  }

  color(app: Carbon) {
    console.log('color')
  }

  background(app: Carbon) {
    console.log('background')
  }
}
