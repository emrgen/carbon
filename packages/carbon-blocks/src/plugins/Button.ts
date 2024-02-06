import {CarbonPlugin, EventHandlerMap, NodeSpec, preventAndStopCtx} from "@emrgen/carbon-core";

export class Button extends CarbonPlugin {
  name = "button";

  description = "A button";

  spec(): NodeSpec {
    return {
      group: "content",
      content: "title",
      isolate: true,
      props: {
        local: {
          placeholder: {
            empty: 'Untitled',
          },
        }
      }
    }
  }

  handlers(): EventHandlerMap {
    return {
      click: (ctx) => {}
    }
  }

  keydown(): EventHandlerMap {
    return {
      enter: preventAndStopCtx,
    }
  }
}
