import {
  ActivatedPath,
  Carbon,
  ContenteditablePath,
  Node,
  NodeBTree,
  NodeId,
  SelectedPath,
  Transaction,
} from "@emrgen/carbon-core";
import { NodeTopicEmitter } from "@emrgen/carbon-core/src/core/NodeEmitter";

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
  }

  deactivateItem(cmd: Transaction, node: Node) {
    cmd.Update(node.id, {
      [ActivatedPath]: false,
      [ContenteditablePath]: false,
    });
  }

  onBoardClick(e, node: Node) {
    const { selectedItems, app, activeItem } = this;
    const { cmd } = app;
    const events: { node: Node; event: string }[] = [];

    if (activeItem) {
      this.deactivateItem(cmd, node);
      events.push({ node: activeItem, event: "deactivate" });
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

  onClick(e, node: Node) {
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
    }

    if (selectedItems.has(node.id) && selectedItems.size === 1) {
      cmd
        .Update(node.id, { [ActivatedPath]: true, [ContenteditablePath]: true })
        .Dispatch();
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

  onDoubleClick(e, item: NodeId) {}

  onMouseDown(e, item: NodeId) {}

  onMouseUp(e, item: NodeId) {}

  onMouseMove(e, item: NodeId) {}

  onMouseEnter(e, item: NodeId) {}

  onMouseLeave(e, item: NodeId) {}
}
