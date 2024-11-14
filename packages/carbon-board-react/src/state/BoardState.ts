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
  stop,
  Transaction,
} from "@emrgen/carbon-core";
import { NodeTopicEmitter } from "@emrgen/carbon-core/src/core/NodeEmitter";
import { KeyboardEvent } from "react";
import { Optional } from "@emrgen/types";

export class SquareBoardState extends NodeTopicEmitter {
  app: Carbon;
  activeItem: Node | null;
  activeComment: Node | null;
  selectedItems: NodeBTree;

  constructor(app: Carbon) {
    super();
    this.app = app;
    this.activeItem = null;
    this.activeComment = null;
    this.selectedItems = new NodeBTree();
  }

  static default(app: Carbon) {
    return new SquareBoardState(app);
  }

  deselectItems(cmd: Transaction, items: NodeBTree) {
    items.forEach((n) => {
      cmd.Update(n.id, { [SelectedPath]: false });
    });
  }

  selectItem(cmd: Transaction, node: Node) {
    cmd.Update(node.id, { [SelectedPath]: true });
    this.selectedItems.set(node.id, node);
  }

  activateItem(
    cmd: Transaction,
    node: Node,
    currentNode: Optional<Node>,
    editable = true,
    select = true,
  ) {
    cmd.Update(node.id, {
      [ActivatedPath]: true,
      [ContenteditablePath]: editable,
    });

    const closestNode = currentNode?.chain.find(
      (n) => n.type.name === "sqTitle" || n.type.name === "sqDescription",
    );

    const hasTitle = node.type.contentMatch.next.some(
      (t) => t.type.name === "sqTitle",
    );

    // if select flag is true, add selection to the Transaction
    if (select) {
      if (closestNode?.name === "sqTitle") {
        const { firstChild } = node;
        const tail = Pin.toEndOf(firstChild!)!;
        const head = Pin.toStartOf(firstChild!)!;
        const after = PinnedSelection.create(head, tail);
        cmd.Select(after, ActionOrigin.UserInput);
      } else if (closestNode?.name === "sqDescription") {
        const pin = Pin.toEndOf(closestNode)!;
        const after = PinnedSelection.fromPin(pin);
        cmd.Select(after, ActionOrigin.UserInput);
      } else {
        // select the title node fully for certain types of nodes
        const pin = Pin.toEndOf(node)!;
        if (pin.node.name !== "sqTitle") {
          const after = PinnedSelection.fromPin(pin);
          cmd.Select(after, ActionOrigin.UserInput);
        }
      }
    }
  }

  deactivateItem(cmd: Transaction, node: Optional<Node>) {
    if (!node) {
      return;
    }
    cmd.Update(node.id, {
      [ActivatedPath]: false,
      [ContenteditablePath]: false,
    });
    cmd.Select(PinnedSelection.IDENTITY);
  }

  deactivateItems(cmd: Transaction, items: NodeBTree) {
    items.forEach((n) => {
      cmd.Update(n.id, {
        [ActivatedPath]: false,
        [ContenteditablePath]: false,
      });
    });
  }

  onBoardClick(e: KeyboardEvent, node: Node) {
    const { selectedItems, app, activeItem } = this;
    const { cmd } = app;
    const events: { node: Node; event: string }[] = [];

    selectedItems.forEach((n) => {
      cmd.Update(n, { [SelectedPath]: false });
      events.push({ node: n, event: "deselect" });
    });
    selectedItems.clear();

    if (activeItem) {
      this.deactivateItem(cmd, activeItem);
      events.push({ node: activeItem, event: "deactivate" });
      this.activeItem = null;
    }

    if (this.activeComment) {
      cmd.Update(this.activeComment.firstChild!, {
        [ContenteditablePath]: false,
      });
      this.activeComment = null;
    }

    cmd.Dispatch();
    events.forEach(({ node, event }) => this.emit(node, event));
    console.log(events);
  }

  onClick(e: KeyboardEvent, node: Node) {
    const { selectedItems, app, activeItem } = this;
    const { cmd } = app;
    const events: { node: Node; event: string }[] = [];

    let currentNode: Optional<Node>;
    let el: Optional<Element> = e.target as Element;
    while (el) {
      currentNode = app.store.get(el);
      if (currentNode) {
        break;
      }
      el = el.parentElement;
    }

    // if the clicked node is already active, do nothing
    if (activeItem) {
      if (activeItem.eq(node)) {
        return;
      }

      if (this.activeComment) {
        cmd.Update(this.activeComment.firstChild!, {
          [ContenteditablePath]: false,
        });
        this.activeComment = null;
      }

      // deactivate the current active node
      cmd.Update(activeItem.id, {
        [ActivatedPath]: false,
        [ContenteditablePath]: false,
      });
      events.push({ node: activeItem, event: "deactivate" });
      this.activeItem = null;
    }

    //
    if (selectedItems.has(node.id) && selectedItems.size === 1) {
      this.activateItem(cmd, node, currentNode);
      cmd.Dispatch();

      events.push({ node: node, event: "activate" });
      this.activeItem = node;
      return;
    }

    if (this.activeComment) {
      cmd.Update(this.activeComment.firstChild!, {
        [ContenteditablePath]: false,
      });
      this.activeComment = null;
    }

    // mark the already selected items as deselected
    selectedItems.forEach((n) => {
      cmd.Update(n, { [SelectedPath]: false });
      events.push({ node: n, event: "deselect" });
    });
    // mark the clicked node as selected
    cmd.Update(node.id, { [SelectedPath]: true }).Dispatch();
    events.push({ node: node, event: "select" });

    this.selectedItems.clear();
    this.selectedItems.set(node.id, node);
    events.forEach(({ node, event }) => this.emit(node, event));
  }

  onEditComment(e, commentLine: Node) {
    const { selectedItems, app, activeItem } = this;
    const { parent } = commentLine;
    if (!parent) {
      throw new Error("Comment line must have a parent");
    }

    // let the event pass to parent event handlers
    // if (
    //   selectedItems.length > 1 ||
    //   selectedItems.length === 0 ||
    //   !selectedItems.has(parent.id)
    // ) {
    //   return;
    // }

    stop(e);
    const { cmd } = app;
    if (!this.activeItem?.eq(parent)) {
      this.deactivateItem(cmd, this.activeItem);
      this.deselectItems(cmd, selectedItems);

      this.selectItem(cmd, parent);
      this.activateItem(cmd, parent, null, false, false);

      if (this.activeComment) {
        cmd.Update(this.activeComment.firstChild!, {
          [ContenteditablePath]: false,
        });
        this.activeComment = null;
      }

      cmd.Update(commentLine.firstChild!, {
        [ContenteditablePath]: true,
      });
      this.activeComment = commentLine;
      const pin = Pin.toEndOf(commentLine)!;
      const after = PinnedSelection.fromPin(pin);
      cmd.Select(after, ActionOrigin.UserInput);
      console.log("dispatching", cmd);

      cmd.Dispatch();
    } else {
      if (this.activeComment) {
        cmd.Update(this.activeComment.firstChild!, {
          [ContenteditablePath]: false,
        });
      }
      cmd.Update(commentLine.firstChild!, {
        [ContenteditablePath]: true,
      });
      this.activeComment = commentLine;
      const pin = Pin.toEndOf(commentLine)!;
      const after = PinnedSelection.fromPin(pin);
      cmd.Select(after, ActionOrigin.UserInput);
      cmd.Dispatch();
    }
  }

  onReplyComment(e, comment: Node) {

  }

  onSendComment(e, commentLine: Node) {
    const { selectedItems, app, activeItem } = this;
    const { parent } = commentLine;
    app.cmd
      .Update(commentLine.firstChild!, {
        [ContenteditablePath]: false,
      })
      .Select(PinnedSelection.IDENTITY)
      .Dispatch();
  }

  onDoubleClick(e: KeyboardEvent, item: NodeId) { }

  onMouseDown(e: KeyboardEvent, item: NodeId) { }

  onMouseUp(e: KeyboardEvent, item: NodeId) { }

  onMouseMove(e: KeyboardEvent, item: NodeId) { }

  onMouseEnter(e: KeyboardEvent, item: NodeId) { }

  onMouseLeave(e: KeyboardEvent, item: NodeId) { }
}
