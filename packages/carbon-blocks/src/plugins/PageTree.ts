import {
  CarbonPlugin,
  CollapsedPath,
  ContenteditablePath,
  EventContext,
  EventHandlerMap,
  FocusEditablePath,
  LocalDirtyCounterPath,
  Node,
  NodeSpec,
  OpenedPath,
  preventAndStopCtx,
  Transaction,
  UpdatePropsAction,
} from "@emrgen/carbon-core";

export const PageTreeGroupName = "pageTreeGroup";
export const PageTreeName = "pageTree";
export const PageTreeItemName = "pageTreeItem";

declare module "@emrgen/carbon-core" {
  export interface Transaction {
    pageTree: {
      expand(node: Node): Transaction;
      close(node: Node): Transaction;
      toggle(node: Node): Transaction;
    };
    pageTreeItem: {
      open(node: Node): Transaction;
      close(node: Node): Transaction;
      expand(node: Node): Transaction;
      collapse(node: Node): Transaction;
    };
  }
}

export class PageTree extends CarbonPlugin {
  name = PageTreeName;

  spec(): NodeSpec {
    return {
      group: "",
      content: "title pageTreeItem*",
      focusable: true,
      isolate: true,
      props: {
        local: {
          html: {
            suppressContentEditableWarning: true,
            contentEditable: false,
          },
        },
      },
    };
  }

  commands(): Record<string, Function> {
    return {
      close: this.closeAll,
      toggle: this.toggle,
      expand: this.expand,
    };
  }

  toggle(tr: Transaction, node: Node) {
    return tr.collapsible.toggle(node);
  }

  expand(tr: Transaction, node: Node) {
    return tr.collapsible.expand(node);
  }

  closeAll(tr: Transaction, node: Node) {
    node.all((n) => {
      if (n.name === PageTreeItemName && n.isOpen) {
        tr.pageTreeItem.close(n);
      }
    });
  }

  plugins(): CarbonPlugin[] {
    return [new PageTreeGroup(), new PageTreeItem()];
  }
}

export class PageTreeItem extends CarbonPlugin {
  name = PageTreeItemName;

  spec(): NodeSpec {
    return {
      group: "nestable",
      content: "plainText pageTreeItem*",
      focusable: true,
      isolate: true,
      selection: {
        inline: true,
      },
      dnd: {
        // draggable: true,
        container: true,
        drop: {
          before: true,
          after: true,
          within: true,
          nestable: true,
        },
      },
      props: {
        local: {
          placeholder: {
            empty: "Untitled",
            focused: "Untitled",
          },
          html: {
            suppressContentEditableWarning: true,
            contentEditable: false,
          },
          state: {
            opened: false,
            collapsed: true,
          },
        },
        [CollapsedPath]: true,
      },
    };
  }

  commands(): Record<string, Function> {
    return {
      open: this.open,
      close: this.close,
      expand: this.expand,
      collapse: this.collapse,
    };
  }

  open(tr: Transaction, node: Node): Transaction {
    tr.Add(
      UpdatePropsAction.create(
        node.id,
        {
          [OpenedPath]: true,
        },
        tr.origin,
      ),
    );

    return tr;
  }

  close(tr: Transaction, node: Node) {
    tr.Add(
      UpdatePropsAction.create(
        node.id,
        {
          [OpenedPath]: false,
        },
        tr.origin,
      ),
    );
  }

  expand(tr: Transaction, node: Node) {
    tr.Add(
      UpdatePropsAction.create(
        node.id,
        {
          [CollapsedPath]: false,
        },
        tr.origin,
      ),
    );
  }

  collapse(tr: Transaction, node: Node) {
    tr.Add(
      UpdatePropsAction.create(
        node.id,
        {
          [CollapsedPath]: true,
        },
        tr.origin,
      ),
    );
  }

  handlers(): EventHandlerMap {
    return {
      blur: (ctx: EventContext<KeyboardEvent>) => {
        preventAndStopCtx(ctx);
        const { startNode, currentNode } = ctx;
        const { parent } = startNode;
        // if this node is the closest pageTreeItem node to the target, then mark it closed
        // cmd.Update(currentNode.id, {
        //   [OpenedPath]: false,
        // });

        if (currentNode.firstChild?.props.get(FocusEditablePath)) {
          const { cmd } = ctx;
          cmd.Update(currentNode.firstChild.id, {
            [FocusEditablePath]: false,
            [ContenteditablePath]: false,
          });
          cmd.Update(currentNode, {
            [LocalDirtyCounterPath]: new Date().getTime(),
          });
          cmd.Dispatch();
        }
      },
    };
  }
}

export class PageTreeGroup extends CarbonPlugin {
  name = "pageTreeGroup";

  spec(): NodeSpec {
    return {
      content: "pageTree*",
    };
  }
}
