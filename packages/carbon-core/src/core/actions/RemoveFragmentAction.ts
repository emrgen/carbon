import { Draft } from "../Draft";
import { Node } from "../Node";
import { Point } from "../Point";
import { NodeJSON } from "../types";
import { ActionOrigin, ActionType, CarbonAction } from "./types";

export class RemoveFragmentAction implements CarbonAction {
  readonly type = ActionType.removeFragment;

  static create(at: Point, fragment: Node[], origin: ActionOrigin = ActionOrigin.UserInput) {
    return new RemoveFragmentAction(
      at,
      fragment.map((n) => n.toJSON()),
      origin,
    );
  }

  constructor(
    readonly at: Point,
    readonly fragment: NodeJSON[],
    readonly origin: ActionOrigin,
  ) {}

  execute(draft: Draft): void {}

  // find the current positions of the nodes in the fragment and insert them
  // NOTE: they not be consecutive anymore and event be deleted or moved to another parent
  inverse(origin?: ActionOrigin): CarbonAction {
    return this;
  }

  toJSON(): any {}
}
