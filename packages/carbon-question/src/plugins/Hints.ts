// import { Collapsible } from "./Collapsible";
import { NodeSpec } from "@emrgen/carbon-core";
import { CarbonPlugin } from "@emrgen/carbon-core";
import { EventHandlerMap } from "@emrgen/carbon-core";
import { EventContext } from "@emrgen/carbon-core";
import { preventAndStopCtx } from "@emrgen/carbon-core";

export const ViewedPath = "local/state/viewed";

export class Hints extends CarbonPlugin {
  name = "hints";

  spec(): NodeSpec {
    return {
      group: "",
      isolate: true,
      content: "hint+",
      props: {
        local: {
          html: {
            contentEditable: false,
            suppressContentEditableWarning: true,
          },
        },
      },
    };
  }

  plugins(): CarbonPlugin[] {
    return [new Hint()];
  }
}

export class Hint extends CarbonPlugin {
  name = "hint";

  spec(): NodeSpec {
    return {
      group: "",
      content: "title content*",
    };
  }

  keydown(): EventHandlerMap {
    return {
      enter(ctx: EventContext<KeyboardEvent>) {
        const { app, selection, currentNode } = ctx;
        console.log("[Enter] Hint");
        // if selection is within the collapsible node title split the collapsible node
        if (
          selection.inSameNode &&
          selection.start.node.parent?.eq(currentNode) &&
          !currentNode.isEmpty
        ) {
          preventAndStopCtx(ctx);
          app.cmd.collapsible.split(selection)?.Dispatch();
        }
      },
    };
  }
}
