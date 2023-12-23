import {
  BeforePlugin,
  CarbonPlugin,
  EventContext,
  EventHandlerMap,
  NodeSpec,
  preventAndStopCtx
} from "@emrgen/carbon-core";

export class CodeLine extends CarbonPlugin {

  name = 'codeLine';

  spec(): NodeSpec {
    return {
      content: 'title',
      splits: true,
      splitName: 'codeLine',
      depends: {
        // prev: true,
        // next: true,
      },
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
      new BeforeInputHandler(),
    ]
  }

  handlers(): EventHandlerMap {
    return {
      beforeInput: (ctx: EventContext<KeyboardEvent>) => {
        console.log('beforeInput', ctx.type, ctx.event.key, ctx);
      },
    }
  }

  keydown(): EventHandlerMap {
    return {
      // insert a tab in the code line
      tab: (ctx: EventContext<KeyboardEvent>) => {
        preventAndStopCtx(ctx);

        const {selection, cmd} = ctx;
        const {start} = selection;
        console.log('tab', ctx.type, ctx.event.key, ctx);
        if (selection.isCollapsed) {
          cmd.transform.insertText(selection, "  ").Dispatch();
        }
      }
    }
  }

}

class BeforeInputHandler extends BeforePlugin {
  name = 'beforeCodeInput';

  handlers(): EventHandlerMap {
    return {
      beforeInput: this.beforeInput
    }
  }

  beforeInput(ctx: EventContext<KeyboardEvent>) {
    console.log('beforeInput', ctx.type, ctx.event.key, ctx);
  }

}
