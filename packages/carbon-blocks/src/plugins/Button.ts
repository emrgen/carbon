import {CarbonPlugin, EventHandlerMap, NodeSpec, preventAndStopCtx} from "@emrgen/carbon-core";

export class Button extends CarbonPlugin {
  name = "button";

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
          html: {
            contentEditable: false,
          }
        },
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
