import {
  CarbonPlugin,
  EventContext,
  EventHandlerMap,
  NodeSpec,
} from "@emrgen/carbon-core";

export class CodeMirror extends CarbonPlugin {
  name = "codeMirror";

  spec(): NodeSpec {
    return {
      group: "content",
      content: "codeLine+",
      isolate: true,
      blockSelectable: true,
      rectSelectable: true,
      draggable: true,
      dragHandle: true,
      props: {
        local: {
          html: {
            contentEditable: false,
            suppressContentEditableWarning: true,
          },
        },
      },
    };
  }

  keydown(): EventHandlerMap {
    return {
      shiftTab: (ctx: EventContext<KeyboardEvent>) => {
        ctx.stopPropagation();
      },
    };
  }
}
