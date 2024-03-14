import {CarbonPlugin, NodeSpec} from "@emrgen/carbon-core";

export class Cell extends CarbonPlugin {

  name = "cell";

  spec(): NodeSpec {
    return {
      group: 'content',
      content: 'cellView codeMirror',
      isolate: true,
      props: {
        local: {
          placeholder: {
            empty: 'Cell',
            focused: 'Press / for commands',
          },
          html: {
            suppressContentEditableWarning: true,
            contentEditable: false,
          }
        }
      }
    }
  }

  plugins(): CarbonPlugin[] {
    return [
      new CellView()
    ]
  }
}

export class CellView extends CarbonPlugin {

  name = "cellView";

  spec(): NodeSpec {
    return {
      group: 'block',
      isolate: true,
      props: {}
    }
  }
}
