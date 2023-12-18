import {
  Carbon, CarbonAction,
  CarbonPlugin, CollapsedPath,
  EventContext,
  EventHandlerMap, Node,
  NodeSpec,
  preventAndStopCtx,
  Transaction, UpdatePropsAction
} from "@emrgen/carbon-core";
import { OpenedPath } from "@emrgen/carbon-core/src/core/NodeProps";
import { Optional } from "@emrgen/types";

export const PageTreeName = 'pageTree';
export const PageTreeItemName = 'pageTreeItem';


declare module '@emrgen/carbon-core' {
  export interface CarbonCommands {
    pageTree: {
      closeAll(node: Node): CarbonAction[],
    },
    pageTreeItem: {
      open(node: Node): CarbonAction[],
      close(node: Node): CarbonAction[],
      expand(node: Node): CarbonAction[],
      collapse(node: Node): CarbonAction[],
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
      closeAll: this.closeAll,
    }
  }

  closeAll(app: Carbon, node: Node): CarbonAction[] {
    const actions: CarbonAction[] = [];
    node.forAll(n => {
      if (n.name === PageTreeItemName && n.isOpen) {
        actions.push(...app.cmd.pageTreeItem.close(n));
      }
    })

    return actions;
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

  open(app: Carbon, node: Node): CarbonAction[] {
    return [
      UpdatePropsAction.create(node.id, {
        [OpenedPath]: true
      }, app.runtime.origin),
    ]
  }

  close(app: Carbon, node: Node): CarbonAction[] {
    return [
      UpdatePropsAction.create(node.id, {
        [OpenedPath]: false
      }, app.runtime.origin),
    ]
  }

  expand(app: Carbon, node: Node): CarbonAction[] {
    return [
      UpdatePropsAction.create(node.id, {
        [CollapsedPath]: false,
      }, app.runtime.origin),
    ]
  }

  collapse(app: Carbon, node: Node): CarbonAction[] {
    return [
      UpdatePropsAction.create(node.id, {
        [CollapsedPath]: true,
      }, app.runtime.origin),
    ]
  }

  on(): EventHandlerMap {
    return {
      blur: (ctx: EventContext<KeyboardEvent>) => {
        preventAndStopCtx(ctx);
        const {target, node} = ctx;
        const {parent} = target;
        // if this node is the closest pageTreeItem node to the target, then mark it closed
        if (parent?.name === this.name && target.closest(n => n.name === this.name)?.eq(node)) {
          ctx.app.tr.updateProps(node.id, {
            [OpenedPath]: false
          });
        }
      }
    }
  }
}
