import { CarbonPlugin, NodeSpec } from "@emrgen/carbon-core";

export class Attributes extends CarbonPlugin {
  name = "attributes";

  spec(): NodeSpec {
    return {
      content: "attribute*",
      isolate: true,
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

  plugins(): CarbonPlugin[] {
    return [new Attribute()];
  }
}

export class Attribute extends CarbonPlugin {
  name = "attribute";
}
