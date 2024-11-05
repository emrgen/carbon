import { CarbonPlugin, NodeSpec } from "@emrgen/carbon-core";

export class PageLink extends CarbonPlugin {
  name = "pageLink";

  spec(): NodeSpec {
    return {
      group: "content",
      content: "title",
      splitName: "paragraph",
      inlineSelectable: true,
      isolate: true,
      draggable: true,
      dragHandle: true,
      rectSelectable: true,
      info: {
        title: "Code",
      },
      props: {
        node: {
          focusPlaceholder: "Type '/' for commands",
          emptyPlaceholder: "",
          // tag: 'code',
        },
        local: {
          html: {
            contentEditable: false,
            suppressContentEditableWarning: true,
          },
        },
      },
    };
  }
}
