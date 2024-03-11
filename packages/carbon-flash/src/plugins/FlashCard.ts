import {NodePlugin, NodeSpec} from "@emrgen/carbon-core";

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
            empty: 'Untitled Flash Card',
            focused: '',
          },
        }
      }
    }
  }
}
