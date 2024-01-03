import {CarbonPlugin, Node, NodeSpec, Transaction} from "@emrgen/carbon-core";

const ModalOpenPath = 'local/modal/open';

declare module "@emrgen/carbon-core" {
  export interface Transaction {
    modal: {
      open(node: Node): Transaction;
      close(node: Node): Transaction;
    }
  }
}

export class Modal extends CarbonPlugin {
  name = 'modal';

  spec(): NodeSpec {
    return {
      group: 'content',
      content: 'title? content*',
      isolate: true,
      props: {
        local: {
          modal: {
            open: false,
          },
        },
      }
    }
  }

  commands(): Record<string, Function> {
    return {
      open: this.open,
      close: this.close,
    }
  }

  open(tr: Transaction, node: Node) {
    tr.Update(node, {
      [ModalOpenPath]: true,
    })
  }

  close(tr: Transaction, node: Node) {
    tr.Update(node, {
      [ModalOpenPath]: false,
    })
  }
}
