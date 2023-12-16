import { CarbonPlugin, EventContext, EventHandlerMap, NodeSpec, preventAndStopCtx } from "@emrgen/carbon-core";

export const PageTreeName = 'pageTree';
export const PageTreeItemName = 'pageTreeItem';

export class PageTree extends CarbonPlugin {

  name = PageTreeName;

  spec(): NodeSpec {
    return {
      group: '',
      content: 'title pageTreeItem*',
      focusable: true,
      isolating: true,
      atom: true,
      attrs: {
        html: {
          suppressContentEditableWarning: true,
          contentEditable: false,
        }
      }
    }
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
      attrs: {
        html: {
          suppressContentEditableWarning: true,
          contentEditable: false,
        },
        node: {
          collapsed: true
        }
      }
    }
  }

  on(): EventHandlerMap {
    return {
      blur: (ctx: EventContext<KeyboardEvent>) => {
        preventAndStopCtx(ctx);
        const {target, node} = ctx;
        const {parent} = target;
        // if this node is the closest pageTreeItem node to the target, then mark it closed
        if (parent?.name === this.name && target.closest(n => n.name === this.name)?.eq(node)) {
          ctx.app.tr.updateState(node.id, {opened: false});
        }
      }
    }
  }
}
