import {
  classString,
  deepCloneMap,
  Draft,
  Node,
  NodeData,
} from "@emrgen/carbon-core";
import { Optional } from "@emrgen/types";
import { isArray } from "lodash";
import { IntoNodeId, NodeId } from "../NodeId";
import { ActionOrigin, ActionType, CarbonAction } from "./types";

export type Content = string | NodeData[] | Node[];

// NOTE: it can be transformed into combination of InsertNode/RemoveNode/InsertText/RemoveText action
export class SetContentAction implements CarbonAction {
  readonly type = ActionType.content;

  before: Optional<Content>;

  static create(
    nodeRef: IntoNodeId,
    content: Content,
    origin: ActionOrigin = ActionOrigin.UserInput,
  ) {
    return new SetContentAction(nodeRef.nodeId(), null, content, origin);
  }

  static withBefore(
    nodeRef: IntoNodeId,
    before: Content,
    after: Content,
    origin: ActionOrigin = ActionOrigin.UserInput,
  ) {
    return new SetContentAction(nodeRef.nodeId(), before, after, origin);
  }

  constructor(
    readonly nodeId: NodeId,
    before: Optional<Content>,
    readonly after: Content,
    readonly origin: ActionOrigin,
  ) {
    this.before = before;
  }

  execute(draft: Draft) {
    const { nodeId, after } = this;
    const node = draft.get(nodeId);
    if (!node) {
      throw new Error("failed to find target node from: " + nodeId.toString());
    }

    if (isArray(after)) {
      const nodes = after
        .map((n) => draft.schema.nodeFromJSON(n))
        .filter((n) => !!n) as Node[];
      if (nodes.length !== after.length) {
        throw new Error("failed to create nodes from: " + after.toString());
      }

      draft.updateContent(nodeId, nodes);
    } else {
      draft.updateContent(nodeId, after);
    }

    if (!this.before) {
      if (node.isTextContainer) {
        this.before = node.children.map((n) => n.clone(deepCloneMap));
      } else {
        this.before = node.textContent;
      }
    }
  }

  inverse(): CarbonAction {
    if (this.before == null) {
      throw new Error("Cannot invert action without before state");
    }

    return SetContentAction.withBefore(
      this.nodeId,
      this.after,
      this.before,
      this.origin,
    );
  }

  toString() {
    const { nodeId, after } = this;
    return classString(this)([nodeId, after]);
  }

  toJSON() {
    return {
      type: ActionType.content,
      nodeId: this.nodeId,
      before: this.before,
      after: this.after,
      origin: this.origin,
    };
  }
}
