import { CarbonPlugin, EventHandlerMap, NodeSpec } from "@emrgen/carbon-core";

export const CodeMirrorContentPath = "remote/state/codemirror";

export class CodeMirror extends CarbonPlugin {
  name = "codemirror";

  spec(): NodeSpec {
    return {
      group: "content",
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
    return {};
  }
}
