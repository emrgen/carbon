import {
  CarbonPlugin,
  EventHandlerMap,
  NodeSpec,
  preventAndStopCtx,
} from "@emrgen/carbon-core";

export class Button extends CarbonPlugin {
  name = "button";

  spec(): NodeSpec {
    return {
      group: "content",
      content: "plainText",
      isolate: true,
      props: {
        local: {
          placeholder: {
            empty: "Untitled",
            focused: "Untitled",
          },
          html: {
            contentEditable: false,
          },
        },
      },
    };
  }

  handlers(): EventHandlerMap {
    return {
      click: (ctx) => {},
    };
  }

  keydown(): EventHandlerMap {
    return {
      enter: preventAndStopCtx,
    };
  }
}
