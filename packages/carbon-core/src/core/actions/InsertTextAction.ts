import {
  ActionOrigin,
  CarbonAction,
  Draft,
  Mark,
  Point,
} from "@emrgen/carbon-core";
import dayjs from "dayjs";

// NOTE: it can be transformed into SetContent action
export class InsertTextAction implements CarbonAction {
  time: number = dayjs().unix();

  static create(
    point: Point,
    text: string,
    marks: Mark[] = [],
    origin: ActionOrigin = ActionOrigin.UserInput,
  ) {
    return new InsertTextAction(point, text, origin);
  }

  constructor(
    readonly point: Point,
    readonly text: string,
    readonly origin: ActionOrigin = ActionOrigin.UserInput,
  ) {}

  execute(draft: Draft) {
    const { point, text, origin } = this;
    draft.insertText(point, text);
  }

  inverse(origin?: ActionOrigin | undefined): CarbonAction {
    throw new Error("Method not implemented.");
  }

  toString() {
    const { point, text } = this;
    return `InsertTextAction(${point}, ${text})`;
  }

  toJSON() {
    return {
      type: "insertText",
      point: this.point.toJSON(),
      text: this.text,
      origin: this.origin,
    };
  }
}
