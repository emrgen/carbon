import {CarbonPlugin, MultiPath, Node, NodeSpec, Transaction} from "@emrgen/carbon-core";

declare module '@emrgen/carbon-core' {
  interface Transaction {
    scale: {
      setStep(node: Node, step: number): Transaction;
      setStart(node: Node, start: number): Transaction;
      setEnd(node: Node, end: number): Transaction;
      setValue(node: Node, value: number[]): Transaction;
      toggleValue(node: Node, value: number): Transaction;
    }
  }
}

export const StartPath = "remote/state/start";
export const EndPath = "remote/state/end";
export const StepPath = "remote/state/step";
export const ValuePath = "remote/state/value";

export class Scale extends CarbonPlugin {
  name = "scale";

  spec(): NodeSpec {
    return {
      group: "content",
      draggable: true,
      props: {
        remote: {
          state: {
            start: 0,
            end: 100,
            step: 10,
            value: [1],
            multi: false,
          }
        },
        local: {
          html: {
            contentEditable: false,
          }
        }
      }
    };
  }

  commands(): Record<string, Function> {
    return {
      setStart: this.setStart,
      setEnd: this.setEnd,
      setStep: this.setStep,
      toggleValue: this.toggleValue,
    }
  }

  setStart(tx: Transaction, node: Node, start: number) {
    tx.Update(node, {
      [StartPath]: start,
    });
  }

  setEnd(tx: Transaction, node: Node, end: number) {
    tx.Update(node, {
      [EndPath]: end,
    });
  }

  setStep(tx: Transaction, node: Node, step: number) {
    tx.Update(node, {
      [StepPath]: step,
    });
  }

  toggleValue(tx: Transaction, node: Node, value: number) {
    const values = node.props.get(ValuePath) as number[];
    const multi = node.props.get(MultiPath)
    const index = values.indexOf(value);
    if (multi) {
      if (index > -1) {
        values.splice(index, 1);
      } else {
        values.push(value);
      }
    } else {
      values.splice(0, values.length);
      if (index < 0) {
        values.push(value);
      }
    }

    tx.Update(node, {
      [ValuePath]: values,
    });
  }
}
