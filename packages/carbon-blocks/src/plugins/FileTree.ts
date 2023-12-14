import { CarbonPlugin, NodeSpec } from "@emrgen/carbon-core";

export class FileTree extends CarbonPlugin {

  name = 'fileTree';

  spec(): NodeSpec {
    return {
      group: '',
      content: 'fileTreeItem*',
      focusable: true,
      attrs: {
        html: {
          suppressContentEditableWarning: true,
          contentEditable: false,
        }
      }
    }
  }

  plugins(): CarbonPlugin[] {
    return [
      new FileTreeItem(),
    ]
  }
}

export class FileTreeItem extends CarbonPlugin {

  name = 'fileTreeItem';

  spec(): NodeSpec {
    return {
      group: '',
      content: 'title fileTreeItem*',
      focusable: true,
      attrs: {
        html: {
          suppressContentEditableWarning: true,
          contentEditable: false,
        },
        node: {
          collapsed: true
        }
      }
    }
  }
}
