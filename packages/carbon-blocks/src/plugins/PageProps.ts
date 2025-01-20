import { CarbonPlugin, NodeSpec } from "@emrgen/carbon-core";

export class PageProps extends CarbonPlugin {
  name = "pageProps";
  spec(): NodeSpec {
    return {
      group: "linked",
      content: "",
      selection: {
        rect: true,
      },
      props: {
        local: {
          html: {
            className: "page-props",
            contentEditable: false,
            suppressContentEditableWarning: true,
          },
        },
      },
    };
  }
}
