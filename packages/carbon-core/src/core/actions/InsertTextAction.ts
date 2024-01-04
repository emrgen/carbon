import {ActionOrigin, CarbonAction, Draft, Point, Transaction} from "@emrgen/carbon-core";

// NOTE: it can be transformed into SetContent action
export class InsertTextAction implements CarbonAction {
  static create(point: Point, text: string, origin: ActionOrigin = ActionOrigin.UserInput) {
    return new InsertTextAction(point, text, origin);
  }

  constructor(readonly point: Point, readonly text: string, readonly origin: ActionOrigin = ActionOrigin.UserInput) {}

  execute(tr: Transaction, draft: Draft): void {
    const { point, text, origin } = this;
    draft.insertText(point, text);
  }
  inverse(origin?: ActionOrigin | undefined): CarbonAction {
    throw new Error("Method not implemented.");
  }

}
