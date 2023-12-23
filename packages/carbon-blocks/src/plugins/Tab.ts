import {
  CarbonPlugin,
  EventContext,
  EventHandler,
  EventHandlerMap,
  NodeSpec,
  preventAndStopCtx
} from "@emrgen/carbon-core";

export class TabGroup extends CarbonPlugin {

  name = 'tabGroup';

  spec(): NodeSpec {
    return {
      group: 'content',
      content: 'tab+',
      isolate: true,
      props: {
        local:{
          html: {
            contentEditable: false,
            suppressContentEditableWarning: true,
          }
        }
      }
    }
  }

  plugins(): CarbonPlugin[] {
    return [
      new Tab(),
    ]
  }
}

export class Tab extends CarbonPlugin {

  name = 'tab';

  spec(): NodeSpec {
    return {
      group: '',
      content: 'title content*',
      isolate: true,
      collapsible: true,
      props: {
        local:{
          html: {
            contentEditable: true,
            suppressContentEditableWarning: true,
          }
        }
      }
    }
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

