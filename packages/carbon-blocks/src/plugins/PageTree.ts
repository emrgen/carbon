import {
  CarbonPlugin, CollapsedPath,
  EventContext,
  EventHandlerMap, Node,
  NodeSpec,
  preventAndStopCtx,
  Transaction, UpdatePropsAction,OpenedPath
} from "@emrgen/carbon-core";

export const PageTreeName = 'pageTree';
export const PageTreeItemName = 'pageTreeItem';


declare module '@emrgen/carbon-core' {
  export interface Transaction {
    pageTree: {
      close(node: Node): Transaction,
      toggle(node: Node): Transaction,
    },
    pageTreeItem: {
      open(node: Node): Transaction,
      close(node: Node): Transaction,
      expand(node: Node): Transaction,
      collapse(node: Node): Transaction,
    }
  }
}

export class PageTree extends CarbonPlugin {

  name = PageTreeName;

  spec(): NodeSpec {
    return {
      group: '',
      content: 'title pageTreeItem*',
      focusable: true,
      isolating: true,
      atom: true,
      props: {
        local: {
          html: {
            suppressContentEditableWarning: true,
            contentEditable: false,
          }
        }
      }
    }
  }

  commands(): Record<string, Function> {
    return {
      close: this.closeAll,
    }
  }

  closeAll(tr: Transaction, node: Node) {
    node.forAll(n => {
      if (n.name === PageTreeItemName && n.isOpen) {
        tr.pageTreeItem.close(n)
      }
    })
  }

  plugins(): CarbonPlugin[] {
    return [
      new PageTreeItem(),
    ]
  }
}

export class PageTreeItem extends CarbonPlugin {

  name = PageTreeItemName;

  spec(): NodeSpec {
    return {
      group: '',
      content: 'title pageTreeItem*',
      focusable: true,
      props: {
        local: {
          html: {
            suppressContentEditableWarning: true,
            contentEditable: false,
          },
          state: {
            opened: false,
            collapsed: true,
          }
        },
      },
    }
  }

  commands(): Record<string, Function> {
    return {
      open: this.open,
      close: this.close,
      expand: this.expand,
      collapse: this.collapse,
    }
  }

  open(tr: Transaction, node: Node): Transaction {
    tr.add(UpdatePropsAction.create(node.id, {
      [OpenedPath]: true
    }, tr.origin));

    return tr;
  }

  close(tr: Transaction, node: Node) {
    tr.add(UpdatePropsAction.create(node.id, {
      [OpenedPath]: false
    }, tr.origin));
  }

  expand(tr: Transaction, node: Node) {
    tr.add(UpdatePropsAction.create(node.id, {
      [CollapsedPath]: false
    }, tr.origin));
  }

  collapse(tr: Transaction, node: Node) {
    tr.add(UpdatePropsAction.create(node.id, {
      [CollapsedPath]: true,
    }, tr.origin));
  }

  on(): EventHandlerMap {
    return {
      blur: (ctx: EventContext<KeyboardEvent>) => {
        preventAndStopCtx(ctx);
        const {target, node} = ctx;
        const {parent} = target;
        // if this node is the closest pageTreeItem node to the target, then mark it closed
        if (parent?.name === this.name && target.closest(n => n.name === this.name)?.eq(node)) {
          ctx.cmd.updateProps(node.id, {
            [OpenedPath]: false
          });
        }
      }
    }
  }
}
