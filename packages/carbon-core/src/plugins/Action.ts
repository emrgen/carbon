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
    insert(at: Point, nodes: Node | Node[]): Transaction,
    insertBefore(refId: Node | NodeId, nodes: Node | Node[]): Transaction,
    insertAfter(refId: Node | NodeId, nodes: Node | Node[]): Transaction,
    insertDefault(at: Point, name: NodeName): Transaction,
    insertDefaultBefore(refId: Node | NodeId, name: NodeName): Transaction,
    insertDefaultAfter(refId: Node | NodeId, name: NodeName): Transaction,
    remove(at: Point, node: Node): Transaction,
    move(from: Point, to: Point, node: Node): Transaction,
    change(ref: Node | NodeId, to: NodeName): Transaction,
    mark(start: Point, end: Point, mark: Mark): Transaction,
    update(ref: Node | NodeId, attrs: Partial<NodePropsJson>): Transaction,
    action: {
      select(selection: PinnedSelection | PointedSelection): Transaction,
      setContent(ref: Node | NodeId, after: NodeContent): Transaction,
      insert(at: Point, nodes: Node | Node[]): Transaction,
      insertBefore(refId: Node | NodeId, nodes: Node | Node[]): Transaction,
      insertAfter(refId: Node | NodeId, nodes: Node | Node[]): Transaction,
      insertDefault(at: Point, name: NodeName): Transaction,
      insertDefaultBefore(refId: Node | NodeId, name: NodeName): Transaction,
      insertDefaultAfter(refId: Node | NodeId, name: NodeName): Transaction,
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
      setContent: this.setContent,
      insert: this.insert,
      insertBefore: this.insertBefore,
      insertAfter: this.insertAfter,
      insertDefault: this.insertDefault,
      insertDefaultBefore: this.insertDefaultBefore,
      insertDefaultAfter: this.insertDefaultAfter,
      remove: this.remove,
      move: this.move,
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

  insertBefore(tr: Transaction, ref: Node | NodeId, nodes: Node | Node[]) {
    tr.Insert(Point.toBefore(ref), nodes);
  }

  insertAfter(tr: Transaction, ref: Node | NodeId, nodes: Node | Node[]) {
    tr.Insert(Point.toAfter(ref), nodes);
  }

  insertDefault(tr: Transaction, at: Point, name: NodeName) {
    const node = tr.app.schema.type(name)?.default();
    if (!node) return;
    tr.Insert(at, node);
  }

  insertDefaultBefore(tr: Transaction, ref: Node | NodeId, name: NodeName) {
    const node = tr.app.schema.type(name)?.default();
    if (!node) return;
    tr.Insert(Point.toBefore(ref), node);
  }

  insertDefaultAfter(tr: Transaction, ref: Node | NodeId, name: NodeName) {
    const node = tr.app.schema.type(name)?.default();
    if (!node) return;
    tr.Insert(Point.toAfter(ref), node);
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
