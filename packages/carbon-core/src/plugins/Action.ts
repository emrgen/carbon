import {
  ActionOrigin,
  BlockSelection,
  CarbonPlugin,
  Mark,
  MarkSet,
  MarksPath,
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
import { InlineNode } from "../core/InlineNode";
import { flatten } from "lodash";

declare module "@emrgen/carbon-core" {
  export interface Transaction {
    select(selection: PinnedSelection | PointedSelection): Transaction;

    setContent(ref: Node | NodeId, after: Node[] | string): Transaction;

    insert(at: Point, nodes: Node | Node[]): Transaction;

    remove(at: Point, node: Node): Transaction;

    move(from: Point, to: Point, node: Node): Transaction;

    change(ref: Node | NodeId, to: NodeName): Transaction;

    format(
      tr: Transaction,
      selection: Selection | BlockSelection,
      mark: Mark,
    ): Transaction;

    update(ref: Node | NodeId, attrs: Partial<NodePropsJson>): Transaction;

    dispatch(): void;

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
    origin?: ActionOrigin,
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

  format(tr: Transaction, selection: Selection | BlockSelection, mark: Mark) {
    if (selection instanceof BlockSelection) {
      throw new Error("Not implemented");
    } else {
      console.log("Format selection", selection, mark);
      const { start, end } = selection.pin(tr.state.nodeMap)!;
      const startDownPin = start.down();
      const endDownPin = end.down();
      const { node: startNode } = startDownPin;
      const { node: endNode } = endDownPin;

      console.log(startDownPin.node.textContent, endDownPin.node.textContent);

      // update start node marks after splitting
      const startNodes = InlineNode.from(startDownPin.node).split(
        startDownPin.offset,
      );

      // update end node marks after splitting
      const endNodes = InlineNode.from(endDownPin.node).split(
        endDownPin.offset,
      );

      // if start and end pin are within the same title node
      if (start.node.eq(endNode)) {
        const { children } = start.node;
        let nodes = children;
        let updated = false;

        if (endNodes.length === 2) {
          nodes = flatten(
            children.map((child) => {
              if (child.eq(endNode)) {
                return endNodes;
              }
              return child;
            }),
          );

          updated = true;
        }

        if (startNodes.length === 2) {
          nodes = flatten(
            children.map((child) => {
              if (child.eq(start.node)) {
                return startNodes;
              }
              return child;
            }),
          );

          updated = true;
        }

        if (updated) {
          tr.SetContent(start.node, nodes);
        }
      } else {
        // if start and end pin are in different title nodes

        if (startNodes.length === 2) {
          const { children } = start.node;
          const nodes = flatten(
            children.map((child) => {
              if (child.eq(start.node)) {
                return startNodes;
              }
              return child;
            }),
          );

          tr.SetContent(start.node, nodes);
        }

        if (endNodes.length === 2) {
          const { children } = endNode;
          const nodes = flatten(
            children.map((child) => {
              if (child.eq(endNode)) {
                return endNodes;
              }
              return child;
            }),
          );

          tr.SetContent(endNode, nodes);
        }
      }

      if (!startDownPin.node.eq(endNode)) {
        startDownPin.node.next((next) => {
          if (next.eq(endNode)) {
            return true;
          }

          console.log(
            "Format node",
            next.id.toString(),
            next.textContent,
            next.marks.toString(),
          );

          const marks = MarkSet.from(next.marks).toggle(mark).toArray();
          tr.Update(next, {
            [MarksPath]: marks,
          });

          return false;
        });
      }

      if (startNodes.length === 2) {
        const [_, tailNode] = startNodes;
        const marks = MarkSet.from(tailNode.marks).toggle(mark).toArray();
        tr.Update(tailNode, {
          [MarksPath]: marks,
        });
      }

      if (endNodes.length === 2) {
        const [headNode, _] = endNodes;
        const marks = MarkSet.from(headNode.marks).toggle(mark).toArray();
        tr.Update(headNode, {
          [MarksPath]: marks,
        });
      }
    }
  }

  dispatch(tr: Transaction) {
    tr.Dispatch();
  }
}
