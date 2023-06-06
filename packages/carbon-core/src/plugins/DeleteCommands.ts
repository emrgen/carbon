
import { each, first, last, merge } from "lodash";

import { Optional } from "@emrgen/types";
import { InsertNodes } from "../core/actions/InsertNodes";
import { MoveAction } from "../core/actions/MoveAction";
import { RemoveNode } from "../core/actions/RemoveNode";
import { RemoveText } from "../core/actions/RemoveText";
import { Action, ActionOrigin } from "../core/actions/types";
import { NodeIdSet } from "../core/BSet";
import { Carbon } from "../core/Carbon";
import { SelectionPatch } from "../core/DeleteGroup";
import { Fragment } from "../core/Fragment";
import { p14 } from "../core/Logger";
import { Node } from "../core/Node";
import { NodeId } from "../core/NodeId";
import { NodeType } from "../core/NodeType";
import { Pin } from "../core/Pin";
import { PinnedSelection } from "../core";
import { BeforePlugin } from "../core/CarbonPlugin";
import { Point } from "../core/Point";
import { PointedSelection } from "../core/PointedSelection";
import { Range } from "../core/Range";
import { Transaction } from "../core/Transaction";
import { NodeName } from "../core/types";
import { takeUntil } from "../utils/array";
import { blocksBelowCommonNode } from "../utils/findNodes";
import { nodeLocation } from "../utils/location";
import { SetContent } from "../core/actions/SetContent";
import { splitTextBlock } from "../utils/split";


declare module '@emrgen/carbon-core' {
  export interface CarbonCommands {
    delete: {
      patch(patch: SelectionPatch): Optional<Transaction>;
    };
  }
}

//
export class DeleteCommands extends BeforePlugin {

  name = "delete";

  commands() {
    return {
      patch: this.patch,
    };
  }

  //
  patch(app: Carbon, patch: SelectionPatch = SelectionPatch.fromState(app.state)) {

  }

}
