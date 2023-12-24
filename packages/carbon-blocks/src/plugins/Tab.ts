import {
  CarbonPlugin,
  EventContext,
  EventHandler,
  EventHandlerMap,
  NodeSpec,
  preventAndStopCtx
} from "@emrgen/carbon-core";
import {IsolateChildren} from "./IsolateChildren";

export const TabsName = 'tabs';
export const TabName = 'tab';

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
        local:{
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

