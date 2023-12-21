import { classString } from "../Logger";
import { InlineContent, NodeContent } from "../NodeContent";
import { IntoNodeId, NodeId } from "../NodeId";
import { Transaction } from "../Transaction";
import { ActionOrigin, CarbonAction } from "./types";
import { Optional } from '@emrgen/types';
import { StateDraft } from '../StateDraft';

export class SetContentAction implements CarbonAction {
  before: Optional<NodeContent>;

  static create(nodeRef: IntoNodeId, after: NodeContent, origin: ActionOrigin = ActionOrigin.UserInput) {
    return new SetContentAction(nodeRef.intoNodeId(), after, null, origin)
  }

  static withContent(nodeId: NodeId, after: NodeContent, before: NodeContent, origin: ActionOrigin = ActionOrigin.UserInput) {
    return new SetContentAction(nodeId, after, before, origin)
  }

  constructor(readonly nodeId: NodeId, readonly after: NodeContent, before: Optional<NodeContent>, readonly origin: ActionOrigin) {}

  execute(tr: Transaction, draft: StateDraft) {
    const {app,} = tr
    const {nodeId, after} = this
    const node = draft.get(nodeId);
    if (!node) {
      throw new Error('failed to find target node from: ' + nodeId.toString())
    }

    draft.updateContent(nodeId, after);

    const a = (b) => b.clone(a)
    this.before = node.content.clone(a);
  }

  merge(other: SetContentAction): SetContentAction {
    console.log('####', this.before);

    return SetContentAction.withContent(this.nodeId, other.after, this.before!, this.origin)
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
    return classString(this)([nodeId, after instanceof InlineContent ? after.textContent :after.children.map(n => n.textContent)]);
  }
}
