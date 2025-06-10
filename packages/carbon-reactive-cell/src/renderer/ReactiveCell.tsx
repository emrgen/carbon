import { CarbonPlugin, NodeSpec } from "@emrgen/carbon-core";
import { ReactiveCellEditor } from "./ReactiveCellEditor";
import { ReactiveCellViewer } from "./ReactiveCellViewer";

export class ReactiveCell extends CarbonPlugin {
  name = "reactiveCell";

  spec(): NodeSpec {
    return {};
  }

  plugins(): CarbonPlugin[] {
    return [new ReactiveCellEditor(), new ReactiveCellViewer()];
  }
}
