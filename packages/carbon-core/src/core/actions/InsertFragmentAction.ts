import { Draft } from "../Draft";
import { Node } from "../Node";
import { Point } from "../Point";
import { NodeJSON } from "../types";
import { ActionOrigin, ActionType, CarbonAction } from "./types";

export class InsertFragmentAction implements CarbonAction {
  readonly type = ActionType.insertFragment;

  static create(at: Point, fragment: Node[], origin: ActionOrigin = ActionOrigin.UserInput) {
    return new InsertFragmentAction(
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

  execute(draft: Draft): void {
    const { schema } = draft;
    const nodes = this.fragment.map((json) => schema.nodeFromJSON(json)).filter(Boolean) as Node[];
    const refNode = draft.get(this.at.nodeId);
    if (!refNode) {
      throw new Error("failed to find target node from: " + this.at.toString());
    }

    const parent = draft.parent(refNode);
    if (!parent) {
      throw new Error("failed to find parent node from: " + this.at.toString());
    }

    draft.insertFragment(this.at, nodes);
  }

  // find the current positions of the nodes in the fragment and remove them
  // NOTE: they not be consecutive anymore and event be deleted or moved to another parent
  inverse(origin?: ActionOrigin): CarbonAction {
    return this;
  }

  toJSON(): any {}
}
