import {
  CarbonPlugin,
  EventContext,
  EventHandler,
  EventHandlerMap, Node,
  NodeSpec, Point,
  preventAndStopCtx, TitlePath, Transaction, Pin, PinnedSelection, ActivatedPath, ActionOrigin, HiddenPath,
} from "@emrgen/carbon-core";
import {IsolateChildren} from "./IsolateChildren";

const RenamingTabIdPath = 'local/state/rename/tabId';
const ActiveChildIdPath = 'remote/state/active/childId';

export const getActiveTab = (node: Node) => {
  return node.children.find(n => n.properties.get<boolean>(ActivatedPath) ?? false);
}

export const getActiveTabId = (node: Node) => {
  return getActiveTab(node)?.id.toString() ?? '';
}

export const setActiveTabId = (cmd: Transaction, node: Node, tabId: string) => {
  cmd.update(node, {
    [ActiveChildIdPath]: tabId,
  })
  return cmd
}

export const getTabTitle = (node: Node) => {
  return node.properties.get<string>(TitlePath) ?? '';
}

export const getRenamingTabId = (node: Node) => {
  return node.properties.get<string>(RenamingTabIdPath) ?? '';
}

export const setRenamingTabId = (cmd: Transaction, node: Node, tabId: string) => {
  cmd.update(node, {
    [RenamingTabIdPath]: tabId,
  })

  return cmd
}

export const TabsName = 'tabs';
export const TabName = 'tab';

declare module "@emrgen/carbon-core" {
  export interface Transaction {
    tabs: {
      create(tabs: Node): Transaction;
      remove(tabs: Node, tab: Node): Transaction;
      select(tabs: Node, tab: Node): Transaction;
      startRenaming(tabs: Node, tab: Node): Transaction;
      stopRenaming(tabs: Node): Transaction;
    }
  }
}

export class TabGroup extends CarbonPlugin {

  name = TabsName;

  spec(): NodeSpec {
    return {
      group: 'content',
      content: 'tab*',
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
          }
        }
      }
    }
  }

  commands(): Record<string, Function> {
    return {
      create: this.create,
      remove: this.remove,
      select: this.select,
      startRenaming: this.startRenaming,
      stopRenaming: this.stopRenaming,
    }
  }

  create(tr: Transaction, tabs: Node) {
    const {app} = tr;
    const block = app.schema.type(TabName)?.default();
    if (!block) return;
    console.log('created tab', block.id.toString());

    const to = tabs.isVoid ? Point.toStart(tabs.id) : Point.toAfter(tabs.lastChild!.id);
    tr.action.insert(to, block).tabs.select(tabs, block);
  }

  remove(tr: Transaction, tabs: Node, tab: Node) {
    // tr.Remove(tab)
  }

  // select the tab and focus at the start of the tab content
  select(tr: Transaction, tabs: Node, tab: Node) {
    const activeTab = getActiveTab(tabs)
    if (activeTab) {
      tr.action.update(activeTab, {
        [ActivatedPath]: false,
        [HiddenPath]: true,
      })
    }

    tr
      .action.update(tabs, {
        [ActiveChildIdPath]: tab.id.toString(),
        [RenamingTabIdPath]: '',
      })
      .action.update(tab, {
        [ActivatedPath]: true,
        [HiddenPath]: false,
      })

    const after = PinnedSelection.fromPin(Pin.toStartOf(tab)!)
    tr.action.select(after, ActionOrigin.UserInput)
  }

  startRenaming(tr: Transaction, tabs: Node, tab: Node) {
    tr.Update(tabs, {
      [RenamingTabIdPath]: tab.id,
    })
  }

  stopRenaming(tr: Transaction, tabs: Node) {
    tr.Update(tabs, {
      [RenamingTabIdPath]: ''
    })
  }


  plugins(): CarbonPlugin[] {
    return [
      new Tab(),
    ]
  }

  keydown(): EventHandlerMap {
    return {
      left: (ctx: EventContext<KeyboardEvent>) => {
        // focus at the start of the active tab content
        const {app, node: tabs, cmd} = ctx;
        const {selection} = app;
        if (selection.isBlock) {
          preventAndStopCtx(ctx);
          const activeTabId = getActiveTabId(tabs);
          const activeTab = tabs.children.find(n => n.id.toString() === activeTabId);
          if (activeTab) {
            const focus = Pin.toStartOf(activeTab);
            if (!focus) return
            const after = PinnedSelection.fromPin(focus)
            cmd.action.select(after).dispatch();
          }
        }
      },
      right: (ctx: EventContext<KeyboardEvent>) => {
        // focus at the end of the active tab content
        const {app, node: tabs, cmd} = ctx;
        const {selection} = app;
        if (selection.isBlock) {
          preventAndStopCtx(ctx);
          const activeTabId = getActiveTabId(tabs);
          const activeTab = tabs.children.find(n => n.id.toString() === activeTabId);
          if (activeTab) {
            const focus = Pin.toEndOf(activeTab);
            if (!focus) return
            const after = PinnedSelection.fromPin(focus)
            cmd.action.select(after).dispatch();
          }
        }
      },
      // up: preventAndStopCtx,
      // down: preventAndStopCtx,
      // shiftLeft: preventAndStopCtx,
      // shiftRight: preventAndStopCtx,
      enter: (ctx: EventContext<KeyboardEvent>) => {
        if (ctx.selection.isBlock) {
          preventAndStopCtx(ctx);
        }
      },
    }
  }

}

export class Tab extends CarbonPlugin {

  name = TabName

  spec(): NodeSpec {
    return {
      group: '',
      content: 'title content*',
      isolate: true,
      collapsible: true,
      // isolateContent: true,
      blockSelectable: true,
      props: {
        local: {
          html: {
            contentEditable: true,
            suppressContentEditableWarning: true,
          }
        }
      }
    }
  }

  plugins(): CarbonPlugin[] {
    return [
      new IsolateChildren(),
    ]
  }

  keydown(): EventHandlerMap {
    return {
      enter(ctx: EventContext<KeyboardEvent>) {
        const {app, selection, node} = ctx;
        console.log('[Enter] tab');
        // if selection is within the collapsible node title split the collapsible node
        if (selection.inSameNode && selection.start.node.parent?.eq(node) && !node.isEmpty) {
          preventAndStopCtx(ctx);
          app.cmd.collapsible.split(selection)?.Dispatch();
        }
      },
    }
  }
}

