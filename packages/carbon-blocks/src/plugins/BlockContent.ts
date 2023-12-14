import { CarbonPlugin, NodeSpec } from "@emrgen/carbon-core";

export class BlockContent extends CarbonPlugin {
  name = 'blockContent';

  spec(): NodeSpec {
    return {
      group: 'content',
      content: '',
      atom: true,
      insert: true,
      isolating: true,
      draggable: true,
      dragHandle: true,
      rectSelectable: true,
      blockSelectable: true,
      info: {
        title: 'Content',
        description: 'Insert a block content',
        icon: 'content',
        tags: ['content', 'page content', 'block content']
      },
      attrs: {
        html:{
          contentEditable: false,
          suppressContentEditableWarning: true,
        }
      }
    }
  }
}

