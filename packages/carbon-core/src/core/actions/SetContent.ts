import { classString } from "../Logger";
import { NodeContent } from "../NodeContent";
import { NodeId } from "../NodeId";
import { Transaction } from "../Transaction";
import { ActionResult } from "./Result";
import { ActionOrigin, CarbonAction } from "./types";
import { generateActionId } from "./utils";
import { Optional } from '@emrgen/types';
import { CarbonStateDraft } from '../CarbonStateDraft';

export class SetContentAction implements CarbonAction {
  id: number;
  origin: ActionOrigin;
  before: Optional<NodeContent>;

  static create(nodeId: NodeId, after: NodeContent, origin: ActionOrigin = ActionOrigin.UserInput) {
    return new SetContentAction(nodeId, after, null, false, origin)
  }

  static withContent(nodeId: NodeId, after: NodeContent, before: NodeContent, origin: ActionOrigin = ActionOrigin.UserInput) {
    return new SetContentAction(nodeId, after, before, false, origin)
  }

  static fromNative(nodeId: NodeId, after: NodeContent, native: boolean, origin: ActionOrigin = ActionOrigin.UserInput) {
    return new SetContentAction(nodeId, after, null, native, origin)
  }

  constructor(readonly nodeId: NodeId, readonly after: NodeContent, before: Optional<NodeContent>, readonly native: boolean, origin: ActionOrigin) {
    this.id = generateActionId()
    this.origin = origin;
    this.before = before;
  }

  execute(tr: Transaction, draft: CarbonStateDraft): ActionResult<any> {
    const {app,} = tr
    const {nodeId, after} = this
    const node = draft.get(nodeId);
    if (!node) {
      return ActionResult.withError(`Node ${nodeId} not found`);
    }

    draft.updateContent(node, after);

    // if (this.before === null || this.before === undefined) {
    this.before = node.content.clone();
    // }
    const wasEmptyBefore = node.isEmpty;
    node?.updateContent(after);
    // node.forAll(n => {
    //   app.store.put(n);
    // });

    // for first time we need to update parent to update the parent appearance like placeholder
    if (wasEmptyBefore) {
      tr.updated(node.parent!);
    }

    return ActionResult.withValue('done')
  }

  merge(other: SetContentAction): SetContentAction {
    console.log('####', this.before);
    
    return SetContentAction.withContent(this.nodeId, other.after, this.before!, this.origin)
  }

  updatesSameNode(other: SetContentAction): boolean {
    return this.nodeId.eq(other.nodeId);
  }

  inverse(): CarbonAction {
    if (!this.before) {
      throw new Error("Cannot invert action without before state");
    }

    const action = SetContentAction.create(this.nodeId, this.before, this.origin)
    action.before = this.after

    return action
  }

  toString() {
    const { nodeId, after } = this
    return classString(this)([nodeId, after.children.map(n => n.textContent)]);
  }
}
