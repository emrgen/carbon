import {
  CarbonPlugin,
  IntoNodeId, Node,
  NodeContent, NodeId, NodeName, NodePropsJson,
  PinnedSelection, Point,
  PointedSelection,
  Transaction,
  Mark,
} from "@emrgen/carbon-core";

declare module '@emrgen/carbon-core' {
  export interface Transaction {
    select(selection: PinnedSelection | PointedSelection): Transaction;
    setContent(ref: Node | NodeId, after: NodeContent): Transaction;
    insert(ref: Node | NodeId, after: NodeContent): Transaction,
    remove(at: Point, node: Node): Transaction,
    move(from: Point, to: Point, node: Node): Transaction,
    change(ref: Node | NodeId, to: NodeName): Transaction,
    mark(start: Point, end: Point, mark: Mark): Transaction,
    update(ref: Node | NodeId, attrs: Partial<NodePropsJson>): Transaction,
    action: {
      select(selection: PinnedSelection | PointedSelection): Transaction,
      setContent(ref: Node | NodeId, after: NodeContent): Transaction,
      insert(ref: Node | NodeId, after: NodeContent): Transaction,
      remove(at: Point, node: Node): Transaction,
      move(from: Point, to: Point, node: Node): Transaction,
      change(node: Node, to: NodeName): Transaction,
      format(start: Point, end: Point, mark: Mark): Transaction,
      Update(ref: Node | NodeId, attrs: Partial<NodePropsJson>): Transaction,
    }
  }

}

export class ActionPlugin extends CarbonPlugin {
  name = 'action';

  commands(): Record<string, Function> {
    return {
      select: this.select,
    }
  }

  select(tr: Transaction, selection: PinnedSelection | PointedSelection) {
    tr.Select(selection)
  }

  setContent(tr: Transaction, ref: Node | NodeId, after: NodeContent) {
    tr.SetContent(ref, after)
  }

  insert(tr: Transaction, at: Point, nodes: Node | Node[]) {
    tr.Insert(at, nodes);
  }

  remove(tr: Transaction, at: Point, node: Node) {
    tr.Remove(at, node);
  }

  mark(tr: Transaction, start: Point, end: Point, mark: Mark) {
    tr.Mark(start, end, mark);
  }

  move(tr: Transaction, from: Point, to: Point, node: Node) {
    tr.Move(from, to, node.id);
  }

  change(tr: Transaction, ref: Node | NodeId, to: NodeName) {
    tr.Change(ref, to);
  }

  update(tr: Transaction, ref: Node | NodeId, props: Partial<NodePropsJson>) {
    tr.Update(ref, props);
  }
}
