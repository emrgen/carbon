import { CarbonAction, RemoveText, SelectAction } from "./actions";
import { SetContentAction } from "./actions/SetContent";

export class TransactionDo {
  constructor(private readonly actions: CarbonAction[]) {}

  get updatesContent() {
    return this.setsContent
  }

  get setsContent() {
    return this.actions.some(a => a instanceof SetContentAction);
  }

  get select() {
    return this.actions.some(a => a instanceof SelectAction);
  }

  get textInsertOnly() {
    return this.actions.every(a => a instanceof SetContentAction || a instanceof SelectAction);
  }

  get textRemoveOnly() {
    return this.actions.every(a => a instanceof RemoveText || a instanceof SelectAction);
  }

  get selectionOnly() {
    return this.actions.every(a => a instanceof SelectAction);
  }
}
