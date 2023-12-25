import * as Core from '@emrgen/carbon-core';
import {Optional} from "@emrgen/types";
import {Draft, NodeContent, NodeId, NodePropsJson, NodeType, Point, PointedSelection, State} from "@emrgen/carbon-core";
import {Node} from "./Node";

const draftFactory: Core.DraftFactory = (state: State) => {
  return new SolidDraft(state);
}

export class SolidDraft implements Core.Draft {

  constructor(private state: State) {

  }

  change(nodeId: NodeId, type: NodeType): void {
  }

  get(id: NodeId): Optional<Node> {
    return undefined;
  }

  insert(at: Point, node: Node): void {
  }

  move(to: Point, node: Node): void {
  }

  parent(from: NodeId | Node): Optional<Node> {
    return undefined;
  }

  produce(fn: (draft: Draft) => void): State {
    return this.commit();
  }

  commit(): State {
    return null as unknown as State;
  }

  remove(node: Node): void {
  }

  updateContent(nodeId: NodeId, content: NodeContent): void {
  }

  updateProps(nodeId: NodeId, props: Partial<NodePropsJson>) {
  }

  updateSelection(selection: PointedSelection): void {
  }
}
