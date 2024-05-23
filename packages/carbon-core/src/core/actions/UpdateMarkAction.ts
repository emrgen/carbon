import {
  ActionOrigin,
  CarbonAction,
  classString,
  Draft,
  Mark,
} from "@emrgen/carbon-core";

export type MarkAction = "add" | "remove";

export class UpdateMarkAction implements CarbonAction {
  static create(
    action: MarkAction,
    mark: Mark,
    origin: ActionOrigin = ActionOrigin.UserInput,
  ) {
    return new UpdateMarkAction(action, mark, origin);
  }

  constructor(
    readonly action: MarkAction,
    readonly mark: Mark,
    readonly origin: ActionOrigin = ActionOrigin.UserInput,
  ) {}

  execute(draft: Draft): void {
    const { action, mark } = this;
    draft.updateMark(action, mark);
  }

  inverse(origin?: ActionOrigin): CarbonAction {
    const { action, mark } = this;
    return new UpdateMarkAction(
      action === "add" ? "remove" : "add",
      mark,
      origin || this.origin,
    );
  }

  toJSON(): any {
    const { action, mark, origin } = this;
    return { action, mark: mark.toJSON(), origin };
  }

  toString(): string {
    const { action, mark } = this;
    return classString(this)({ action, mark: mark.toString() });
  }
}
