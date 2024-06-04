import {
  ActionOrigin,
  ActivatedPath,
  Carbon,
  ContenteditablePath,
  Node,
  NodeBTree,
  NodeId,
  Pin,
  PinnedSelection,
  SelectedPath,
  Transaction,
} from "@emrgen/carbon-core";
import { NodeTopicEmitter } from "@emrgen/carbon-core/src/core/NodeEmitter";
import { KeyboardEvent } from "react";

export class SquareBoardState extends NodeTopicEmitter {
  app: Carbon;
  activeItem: Node | null;
  selectedItems: NodeBTree;

  constructor(app: Carbon) {
    super();
    this.app = app;
    this.activeItem = null;
    this.selectedItems = new NodeBTree();
  }

  static default(app: Carbon) {
    return new SquareBoardState(app);
  }

  activateItem(cmd: Transaction, node: Node) {
    cmd.Update(node.id, { [ActivatedPath]: true, [ContenteditablePath]: true });

    const hasTitle = node.type.contentMatch.next.some(
      (t) => t.type.name === "sqTitle",
    );

    if (hasTitle) {
      const { firstChild } = node;
      const tail = Pin.toEndOf(firstChild!)!;
      const head = Pin.toStartOf(firstChild!)!;
      const after = PinnedSelection.create(head, tail);
      cmd.Select(after, ActionOrigin.UserInput);
    } else {
      // select the title node fully for certain types of nodes
      const pin = Pin.toEndOf(node)!;
      const tail = pin.moveBy(0)!;
      const after = PinnedSelection.create(tail, pin);
      cmd.Select(after, ActionOrigin.UserInput);
    }
  }

  deactivateItem(cmd: Transaction, node: Node) {
    cmd.Update(node.id, {
      [ActivatedPath]: false,
      [ContenteditablePath]: false,
    });
    cmd.Select(PinnedSelection.IDENTITY);
  }

  onBoardClick(e: KeyboardEvent, node: Node) {
    const { selectedItems, app, activeItem } = this;
    const { cmd } = app;
    const events: { node: Node; event: string }[] = [];

    if (activeItem) {
      this.deactivateItem(cmd, activeItem);
      events.push({ node: activeItem, event: "deactivate" });
      this.activeItem = null;
    }

    selectedItems.forEach((n) => {
      cmd.Update(n, { [SelectedPath]: false });
      events.push({ node: n, event: "deselect" });
    });
    selectedItems.clear();

    cmd.Dispatch();
    events.forEach(({ node, event }) => this.emit(node, event));

    console.log(events);
  }

  onClick(e: KeyboardEvent, node: Node) {
    const { selectedItems, app, activeItem } = this;
    const { cmd } = app;
    const events: { node: Node; event: string }[] = [];

    if (activeItem) {
      if (activeItem.eq(node)) {
        return;
      }

      cmd.Update(activeItem.id, {
        [ActivatedPath]: false,
        [ContenteditablePath]: false,
      });
      events.push({ node: activeItem, event: "deactivate" });
      this.activeItem = null;
    }

    if (selectedItems.has(node.id) && selectedItems.size === 1) {
      this.activateItem(cmd, node);
      cmd.Dispatch();

      events.push({ node: node, event: "activate" });
      this.activeItem = node;
      return;
    }

    // mark the clicked node as selected
    selectedItems.forEach((n) => {
      cmd.Update(n, { [SelectedPath]: false });
      events.push({ node: n, event: "deselect" });
    });
    cmd.Update(node.id, { [SelectedPath]: true }).Dispatch();
    events.push({ node: node, event: "select" });

    this.selectedItems.clear();
    this.selectedItems.set(node.id, node);
    events.forEach(({ node, event }) => this.emit(node, event));
  }

  onDoubleClick(e: KeyboardEvent, item: NodeId) {}

  onMouseDown(e: KeyboardEvent, item: NodeId) {}

  onMouseUp(e: KeyboardEvent, item: NodeId) {}

  onMouseMove(e: KeyboardEvent, item: NodeId) {}

  onMouseEnter(e: KeyboardEvent, item: NodeId) {}

  onMouseLeave(e: KeyboardEvent, item: NodeId) {}
}
