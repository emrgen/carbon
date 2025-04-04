import {
  ActionOrigin,
  BlockSelection,
  CarbonPlugin,
  Mark,
  Node,
  NodeId,
  NodeName,
  NodePropsJson,
  PinnedSelection,
  Point,
  PointedSelection,
  Selection,
  Transaction,
} from "@emrgen/carbon-core";

declare module "@emrgen/carbon-core" {
  export interface Transaction {
    action: {
      select(
        selection: PinnedSelection | PointedSelection,
        origin?: ActionOrigin,
      ): Transaction;
      setContent(ref: Node | NodeId, after: Node[] | string): Transaction;
      insert(at: Point, nodes: Node | Node[]): Transaction;
      remove(at: Point, node: Node): Transaction;
      move(from: Point, to: Point, node: Node): Transaction;
      change(node: Node, to: NodeName): Transaction;
      format(selection: Selection | BlockSelection, mark: Mark): Transaction;
      update(ref: Node | NodeId, attrs: Partial<NodePropsJson>): Transaction;
      dispatch(): void;
    };
  }
}

export class ActionPlugin extends CarbonPlugin {
  name = "action";

  commands(): Record<string, Function> {
    return {
      select: this.select,
      setContent: this.setContent,
      insert: this.insert,
      remove: this.remove,
      change: this.change,
      move: this.move,
      update: this.update,
      format: this.format,
      dispatch: this.dispatch,
    };
  }

  select(
    tr: Transaction,
    selection: PinnedSelection | PointedSelection,
    origin: ActionOrigin = tr.origin,
  ) {
    tr.Select(selection, origin);
  }

  setContent(tr: Transaction, ref: Node | NodeId, after: Node[] | string) {
    tr.SetContent(ref, after);
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

  move(tr: Transaction, from: Point, to: Point, node: Node) {
    tr.Move(from, to, node.id);
  }

  change(tr: Transaction, ref: Node | NodeId, to: NodeName) {
    tr.Change(ref, to);
  }

  update(tr: Transaction, ref: Node | NodeId, props: Partial<NodePropsJson>) {
    tr.Update(ref, props);
  }

  format(
    tr: Transaction,
    selection: PinnedSelection | BlockSelection,
    mark: Mark,
  ) {
    tr.transform.mark(selection, mark);
  }

  dispatch(tr: Transaction) {
    tr.Dispatch();
  }
}
