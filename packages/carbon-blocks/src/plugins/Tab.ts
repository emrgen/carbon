import {
  ActionOrigin,
  ActivatedPath,
  CarbonPlugin,
  EventContext,
  EventHandlerMap,
  HiddenPath,
  Node,
  nodeLocation,
  NodeSpec,
  Pin,
  PinnedSelection,
  Point,
  preventAndStopCtx,
  TitlePath,
  Transaction,
} from "@emrgen/carbon-core";
import { IsolateChildren } from "./IsolateChildren";

const RenamingTabIdPath = "local/state/rename/tabId";
const ActiveTabIdPath = "remote/state/active/tabId";

export const getActiveTab = (node: Node) => {
  return node.children.find(
    (n) => n.props.get<boolean>(ActivatedPath) ?? false,
  );
};

export const getActiveTabId = (node: Node) => {
  return getActiveTab(node)?.id.toString() ?? "";
};

export const setActiveTabId = (cmd: Transaction, node: Node, tabId: string) => {
  cmd.Update(node, {
    [ActiveTabIdPath]: tabId,
  });
  return cmd;
};

export const getTabTitle = (node: Node) => {
  return node.props.get<string>(TitlePath) ?? "";
};

export const getRenamingTabId = (node: Node) => {
  return node.props.get<string>(RenamingTabIdPath) ?? "";
};

export const setRenamingTabId = (
  cmd: Transaction,
  node: Node,
  tabId: string,
) => {
  cmd.Update(node, {
    [RenamingTabIdPath]: tabId,
  });

  return cmd;
};

export const TabsName = "tabs";
export const TabName = "tab";

declare module "@emrgen/carbon-core" {
  export interface Transaction {
    tabs: {
      create(tabs: Node): Transaction;
      remove(tabs: Node, tab: Node): Transaction;
      openTab(tabs: Node, tab: Node): Transaction;
      startRenaming(tabs: Node, tab: Node): Transaction;
      stopRenaming(tabs: Node): Transaction;
    };
  }
}

export class TabGroup extends CarbonPlugin {
  name = TabsName;

  spec(): NodeSpec {
    return {
      group: "content",
      content: "tab*",
      isolate: true,
      dragHandle: true,
      draggable: true,
      rectSelectable: true,
      blockSelectable: true,
      props: {
        local: {
          html: {
            contentEditable: false,
            suppressContentEditableWarning: true,
            className: "ctabs",
          },
          style: {},
        },
      },
    };
  }

  commands(): Record<string, Function> {
    return {
      create: this.create,
      remove: this.remove,
      openTab: this.openTab,
      startRenaming: this.startRenaming,
      stopRenaming: this.stopRenaming,
    };
  }

  create(tr: Transaction, tabs: Node) {
    const { app } = tr;
    const block = app.schema.type(TabName)?.default();
    if (!block) return;
    console.log("created tab", block.id.toString());

    const to = tabs.isVoid
      ? Point.atOffset(tabs.id)
      : Point.toAfter(tabs.lastChild!.id);
    tr.action.insert(to, block).tabs.openTab(tabs, block);
  }

  remove(tr: Transaction, tabs: Node, tab: Node) {
    console.log("remove tab", tab.id.toString());
    const nextSibling = tab.nextSibling;
    const prevSibling = tab.prevSibling;
    const nextActiveTab = nextSibling ?? prevSibling;

    if (nextActiveTab) {
      console.log(tab.parents[0].id.toString(), nextActiveTab.id.toString());
      tr.action.remove(nodeLocation(tab)!, tab);
      this.openTab(tr, tabs, nextActiveTab);
    } else {
      // TODO: insert a default tab and delete the current tab
    }
  }

  // open the tab and focus at the start of the tab content
  openTab(tr: Transaction, tabs: Node, tab: Node) {
    const activeTab = getActiveTab(tabs);
    if (activeTab) {
      tr.action.update(activeTab, {
        [ActivatedPath]: false,
        [HiddenPath]: true,
      });
    }

    tr.action
      .update(tabs, {
        [ActiveTabIdPath]: tab.id.toString(),
        [RenamingTabIdPath]: "",
      })
      .action.update(tab, {
        [ActivatedPath]: true,
        [HiddenPath]: false,
      });

    const after = PinnedSelection.fromPin(Pin.toStartOf(tab)!);
    tr.action.select(after, ActionOrigin.UserInput);
  }

  startRenaming(tr: Transaction, tabs: Node, tab: Node) {
    tr.Update(tabs, {
      [RenamingTabIdPath]: tab.id,
    });
  }

  stopRenaming(tr: Transaction, tabs: Node) {
    tr.Update(tabs, {
      [RenamingTabIdPath]: "",
    });
  }

  plugins(): CarbonPlugin[] {
    return [new Tab()];
  }

  keydown(): EventHandlerMap {
    return {
      left: (ctx: EventContext<KeyboardEvent>) => {
        // focus at the start of the active tab content
        const { app, currentNode: tabs, cmd } = ctx;
        const { selection, blockSelection } = app.state;
        if (blockSelection.isActive) {
          preventAndStopCtx(ctx);
          const activeTabId = getActiveTabId(tabs);
          const activeTab = tabs.children.find(
            (n) => n.id.toString() === activeTabId,
          );
          if (activeTab) {
            const focus = Pin.toStartOf(activeTab);
            if (!focus) return;
            const after = PinnedSelection.fromPin(focus);
            cmd.action.select(after).Dispatch();
          }
        }
      },
      right: (ctx: EventContext<KeyboardEvent>) => {
        // focus at the end of the active tab content
        const { app, currentNode: tabs, cmd } = ctx;
        const { selection, blockSelection } = app.state;
        if (blockSelection.isActive) {
          preventAndStopCtx(ctx);
          const activeTabId = getActiveTabId(tabs);
          const activeTab = tabs.children.find(
            (n) => n.id.toString() === activeTabId,
          );
          if (activeTab) {
            const focus = Pin.toEndOf(activeTab);
            if (!focus) return;
            const after = PinnedSelection.fromPin(focus);
            cmd.action.select(after).Dispatch();
          }
        }
      },
      // up: preventAndStopCtx,
      // down: preventAndStopCtx,
      // shiftLeft: preventAndStopCtx,
      // shiftRight: preventAndStopCtx,
      enter: (ctx: EventContext<KeyboardEvent>) => {
        if (ctx.app.state.blockSelection.isActive) {
          preventAndStopCtx(ctx);
        }
      },
    };
  }
}

export class Tab extends CarbonPlugin {
  name = TabName;

  spec(): NodeSpec {
    return {
      group: "",
      content: "paragraph content*",
      isolate: true,
      collapsible: true,
      // isolateContent: true,
      blockSelectable: true,
      props: {
        local: {
          html: {
            contentEditable: true,
            suppressContentEditableWarning: true,
            className: "ctab__content",
          },
        },
      },
    };
  }

  plugins(): CarbonPlugin[] {
    return [new IsolateChildren()];
  }

  keydown(): EventHandlerMap {
    return {
      enter(ctx: EventContext<KeyboardEvent>) {
        const { app, selection, currentNode } = ctx;
        console.log("[Enter] tab");
        // if selection is within the collapsible node title split the collapsible node
        if (
          selection.inSameNode &&
          selection.start.node.parent?.eq(currentNode) &&
          !currentNode.isEmpty
        ) {
          preventAndStopCtx(ctx);
          app.cmd.collapsible.split(selection)?.Dispatch();
        }
      },
      delete(ctx: EventContext<KeyboardEvent>) {
        if (ctx.app.state.blockSelection.isActive) {
          const { blocks } = ctx.selection;
          if (blocks.length === 1 && blocks[0].eq(ctx.currentNode)) {
            preventAndStopCtx(ctx);
            ctx.cmd.tabs
              .remove(ctx.currentNode.parent!, ctx.currentNode)
              .Dispatch();
          }
        }
      },
      escape(ctx: EventContext<KeyboardEvent>) {
        if (ctx.currentNode.name === TabName) {
          // preventAndStopCtx(ctx);
        }
      },
    };
  }
}
