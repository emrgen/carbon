import { CarbonPlugin, NodeSpec } from "@emrgen/carbon-core";

export class PageContent extends CarbonPlugin {
  name = 'pageContent';

  spec(): NodeSpec {
    return {
      group: 'content',
      content: '',
      atom: true,
      // insert: true,
      isolating: true,
      draggable: true,
      dragHandle: true,
      rectSelectable: true,
      blockSelectable: true,
      info: {
        title: 'Content',
        description: 'Insert a page content',
        icon: 'content',
        tags: ['content']
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
