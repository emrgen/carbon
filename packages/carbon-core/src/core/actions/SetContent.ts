import { classString } from "../Logger";
import { NodeContent } from "../NodeContent";
import { NodeId } from "../NodeId";
import { Point } from "../Point";
import { Transaction } from "../Transaction";
import { ActionResult, NULL_ACTION_RESULT } from "./Result";
import { CarbonAction, ActionOrigin } from "./types";
import { generateActionId } from "./utils";

export class SetContent implements CarbonAction {
  id: number;
  origin: ActionOrigin;

  static create(nodeId: NodeId, content: NodeContent, origin: ActionOrigin = ActionOrigin.UserInput) {
    return new SetContent(nodeId, content, origin)
  }

  constructor(readonly nodeId: NodeId, readonly content: NodeContent, origin: ActionOrigin) {
    this.id = generateActionId()
    this.origin = origin;
  }

  execute(tr: Transaction): ActionResult<any> {
    const {app,} = tr
    const {nodeId, content} = this
    const node = app.store.get(nodeId);
    if (!node) {
      return ActionResult.withError(`Node ${nodeId} not found`);
    }

    node?.updateContent(content);
    node.forAll(n => {
      app.store.put(n);
    });
    tr.updated(node);

    return ActionResult.withValue('done')
  }

  inverse(): CarbonAction {
    throw new Error("Method not implemented.");
  }

  toString() {
    const { nodeId, content } = this
    return classString(this)([nodeId, content.children.map(n => n.textContent)]);
  }
}
