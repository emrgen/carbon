import {CarbonPlugin, NodeSpec} from "@emrgen/carbon-core";

export class CodeMirror extends CarbonPlugin {

  name = 'codeMirror';

  spec(): NodeSpec {
    return {
      group: 'content',
      content: 'codeLine+',
      isolate: true,
      blockSelectable: true,
      rectSelectable: true,
      draggable: true,
      dragHandle: true,
      props:{
        local:{
          html:{
            contentEditable: false,
            suppressContentEditableWarning: true,
          }
        }
      }
    }
  }
}
