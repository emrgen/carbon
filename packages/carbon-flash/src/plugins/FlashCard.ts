import { CarbonPlugin, NodePlugin, NodeSpec } from "@emrgen/carbon-core";
import { FlashAnswer } from "./FlashAnswer";
import { FlashView } from "./FlashView";

export class FlashCard extends NodePlugin {
  name = "flashCard";

  spec(): NodeSpec {
    return {
      group: "content",
      content: "title",
      isolate: true,
      props: {
        local: {
          placeholder: {
            empty: "Untitled Flash Card",
            focused: "",
          },
        },
      },
    };
  }

  plugins(): CarbonPlugin[] {
    return [new FlashView(), new FlashAnswer()];
  }
}
