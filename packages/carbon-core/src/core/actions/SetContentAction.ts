import { IntoNodeId, NodeId } from "../NodeId";
import { Transaction } from "../Transaction";
import { ActionOrigin, CarbonAction } from "./types";
import { Optional } from '@emrgen/types';
import {deepCloneMap, Draft, Node} from "@emrgen/carbon-core";

type Content = string | Node[]

export class SetContentAction implements CarbonAction {
  before: Optional<Content>;

  static create(nodeRef: IntoNodeId, content: Content, origin: ActionOrigin = ActionOrigin.UserInput) {
    return new SetContentAction(nodeRef.nodeId(), content, null, origin)
  }

  constructor(readonly nodeId: NodeId, readonly after: Content, before: Optional<Content>, readonly origin: ActionOrigin) {}

  execute(tr: Transaction, draft: Draft) {
    const {app,} = tr
    const {nodeId, after} = this
    const node = draft.get(nodeId);
    if (!node) {
      throw new Error('failed to find target node from: ' + nodeId.toString())
    }

    draft.updateContent(nodeId, after);
    if (node.isTextContainer) {
      this.before = node.children.map(n => n.clone(deepCloneMap));
    } else {
      this.before = node.textContent
    }
  }

  // merge(other: SetContentAction): SetContentAction {
  //   console.log('####', this.before);
  //
  //   return SetContentAction.withContent(this.nodeId, other.after, this.origin)
  // }

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
    return this;
    // return classString(this)([nodeId, after instanceof InlineContent ? after.textContent :after.children.map(n => n.textContent)]);
  }
}
