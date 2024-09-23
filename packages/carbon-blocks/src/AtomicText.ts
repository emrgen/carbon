import { InlineAtom } from "@emrgen/carbon-core";
import { NodeSpec } from "@emrgen/carbon-core";

export class AtomicText extends InlineAtom {
  name = "atomicText";

  override spec(): NodeSpec {
    return {
      ...super.spec(),
      focusable: false,
      // isolate: true,
      atom: true,
      props: {
        local: {
          html: {
            contentEditable: false,
          },
        },
      },
    };
  }
}
