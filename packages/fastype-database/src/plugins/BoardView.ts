import { CarbonPlugin, NodeSpec } from "@emrgen/carbon-core";

export class BoardView extends CarbonPlugin {

  name = 'board'

  spec(): NodeSpec {
    return {
      group: 'content',
      content: 'title column*',
      draggable: true,
      droppable: true,
      insert: true,
      dragHandle: true,
      isolate: true,
      info: {
        title: 'Board',
        description: 'Create a board',
        icon: 'board',
        tags: ['board', 'kanban'],
      },
      attrs: {
        node: {
          emptyPlaceholder: 'Untitled',
        },
        html: {
          contentEditable: false,
        }
      }
    }
  }
}
