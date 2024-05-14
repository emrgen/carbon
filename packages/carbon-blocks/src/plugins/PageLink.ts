import { CarbonPlugin, NodeSpec } from "@emrgen/carbon-core";

export class PageLink extends CarbonPlugin {
  name = "docLink";

  spec(): NodeSpec {
    return {
      group: "content",
      content: "title",
      splitName: "section",
      inlineSelectable: true,
      isolate: true,
      draggable: true,
      dragHandle: true,
      rectSelectable: true,
      info: {
        title: "Code",
      },
      attrs: {
        node: {
          focusPlaceholder: "Code",
          emptyPlaceholder: "",
          // tag: 'code',
        },
        html: {
          contentEditable: false,
          suppressContentEditableWarning: true,
        },
      },
    };
  }
}
