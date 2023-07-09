import { classString } from "../Logger";
import { NodeContent } from "../NodeContent";
import { NodeId } from "../NodeId";
import { Transaction } from "../Transaction";
import { ActionResult } from "./Result";
import { ActionOrigin, CarbonAction } from "./types";
import { generateActionId } from "./utils";
import { Optional } from '@emrgen/types';

export class SetContent implements CarbonAction {
  id: number;
  origin: ActionOrigin;
  before: Optional<NodeContent>;

  static create(nodeId: NodeId, after: NodeContent, origin: ActionOrigin = ActionOrigin.UserInput) {
    return new SetContent(nodeId, after, null, origin)
  }

  static withContent(nodeId: NodeId, after: NodeContent, before: NodeContent, origin: ActionOrigin = ActionOrigin.UserInput) {
    return new SetContent(nodeId, after, before, origin)
  }

  constructor(readonly nodeId: NodeId, readonly after: NodeContent,  before: Optional<NodeContent>, origin: ActionOrigin) {
    this.id = generateActionId()
    this.origin = origin;
    this.before = before;
  }

  execute(tr: Transaction): ActionResult<any> {
    const {app,} = tr
    const {nodeId, after} = this
    const node = app.store.get(nodeId);
    if (!node) {
      return ActionResult.withError(`Node ${nodeId} not found`);
    }

    if (this.before === null) {
      this.before = node.content.clone();
    }
    node?.updateContent(after);
    node.forAll(n => {
      app.store.put(n);
    });
    tr.updated(node);

    return ActionResult.withValue('done')
  }

  updatesSameNode(other: SetContent): boolean {
    return this.nodeId.eq(other.nodeId);
  }

  inverse(): CarbonAction {
    if (!this.before) {
      throw new Error("Cannot invert action without before state");
    }

    const action = SetContent.create(this.nodeId, this.before, this.origin)
    action.before = this.after

    return action
  }

  toString() {
    const { nodeId, after } = this
    return classString(this)([nodeId, after.children.map(n => n.textContent)]);
  }
}
