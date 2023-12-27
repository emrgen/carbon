import { each, identity } from "lodash";
import { NodeIdSet } from "./BSet";
import { Carbon } from "./Carbon";
import { Node } from "./Node";
import { NodeTopicEmitter } from "./NodeEmitter";
import { SelectionManager } from "./SelectionManager";
import { TransactionManager } from "./TransactionManager";
import { EventsOut } from "./Event";
import { Transaction } from "./Transaction";
import { PluginManager } from "./PluginManager";
import { ActionOrigin, State } from "@emrgen/carbon-core";

export enum NodeChangeType {
  update = "update",
}

interface PromiseState {
  resolve?: Function;
  reject?: Function;
}

/**
 * Syncs the editor state with the UI
 */
export class ChangeManager extends NodeTopicEmitter {

  readonly transactions: Transaction[] = [];
  updated: NodeIdSet = NodeIdSet.empty();

  promiseState: PromiseState;

  private interval: any;

  constructor(
    private readonly app: Carbon,
    private readonly sm: SelectionManager,
    private readonly tm: TransactionManager,
    private readonly pm: PluginManager
  ) {
    super();

    this.promiseState = {}
  }

  private get state() {
    return this.app.state;
  }

  private get store() {
    return this.state.nodeMap;
  }

  private get isContentSynced() {
    return !this.updated.size;
  }

  private get isSelectionDirty() {
    return this.state.isSelectionChanged;
  }

  // 1. sync the doc
  // 2. sync the selection
  // 3. sync the node state
  update(tr: Transaction, state: State, timeout: number = 1000) {
    if (this.transactions.length) {
      // this.promiseState.reject?.();
      return;
    }

    this.transactions.push(tr);
    const { isContentChanged, isSelectionChanged } = this.state;

    // console.log('updating transaction effect', tr);
    // console.log('update', isContentDirty, isNodeStateDirty, isSelectionDirty);
    // if nothing is dirty, then there is nothing to do
    if (!isContentChanged && !isSelectionChanged) {
      return;
    }

    console.log('update', isContentChanged, isSelectionChanged);
    if (isContentChanged) {
      this.updated.clear();
      this.updated = state.updated.clone();
      console.log("syncing: content", this.updated.toArray().map(n => n.toString()));

      this.interval = setTimeout(() => {
        console.error("syncing: content timeout", this.updated.toArray().map(n => n.toString()));
        this.updated.clear();
      }, 2000)
    }

    if (isContentChanged) {
      this.updateContent();
      return;
    }

    if (isSelectionChanged) {
      this.updateSelection(() => {
        this.onTransaction();
      });
    }
    // });
  }

  mounted(node: Node, changeType: NodeChangeType) {
    // console.log('changes size', this.updated.size)
    // if (this.counter > this.stateCounter) {
    //   console.log('mounted: old transaction sync still in progress', this.counter, counter);
    //   return;
    // }

    // force the promise to timeout
    if (!this.updated.has(node.id)) {
      // console.log('mounted node not dirty', node.id.toString(), changeType);
      return;
    }

    // console.log('mounted', node.id.toString(), changeType);

    // keep track of the pending node updates
    if (changeType === NodeChangeType.update) {
      // console.log('mounted', node.id.toString(), changeType, this.changes.size, this.changes.toArray().map(n => n.toString()), node.textContent, node);
      this.updated.remove(node.id);
    }

    // console.log('mounted', this.isContentSynced, this.state.isSelectionDirty);
    if (this.isContentSynced) {
      this.app.emit(EventsOut.contentUpdated, this.state.content);
    }

    // console.log('mounted', this.changes.size, this.changes.toArray().map(n => n.toString()));

    // sync the selection if the content is synced
    // console.log('mounted', this.state.runtime.updatedNodeIds.toArray().map(n => n.toString()), node.id.toString(), this.isContentSynced, this.isStateSynced, this.state.isSelectionDirty);
    if (this.isContentSynced) {
      console.log("content synced, selection dirty:", this.isSelectionDirty);
      // NOTE: if the last transaction did not update the selection, we can go ahead and process the next tick
      if (this.isSelectionDirty) {
        this.updateSelection(() => {
          this.onTransaction();
        });
      } else {
        this.onTransaction();
      }
    }
  }

  private onTransaction() {
    clearInterval(this.interval);
    const tr = this.transactions.shift();
    if (tr) {
      this.pm.onTransaction(tr);
      this.app.emit(EventsOut.transaction, tr);
      this.app.emit(EventsOut.changed, this.state);
    }

    this.app.processTick();

    // this.promiseState.resolve?.();
  }

  private updateContent() {
    console.groupCollapsed("syncing:  content");
    // console.group('syncing: content')
    const updatedNodeIds = this.updated;

    // keep only the top level nodes that have been updated
    // remove the update children
    // this.changes.nodes(this.state.nodeMap).forEach(n => {
    //   if (n.parents.some(p => updatedNodeIds.has(p.id))) {
    //     this.changes.remove(n.id);
    //   }
    // })

    const updatedNodes = updatedNodeIds.map(n => this.store.get(n)).filter(identity) as Node[];

    console.log("updatedNodes", updatedNodes.map(n => n.id.toString()), updatedNodeIds.toArray().map(n => n.toString()));

    // updatedNodes.forEach(n => {
    //   updatedNodeIds.remove(n.id);
    //   if (n.closest(p => updatedNodeIds.has(p.id))) {
    //     return;
    //   }
    //   updatedNodeIds.add(n.id);
    // });

    console.log("publish", updatedNodes.map(n => n.key));

    updatedNodes
      .filter(n => updatedNodeIds.has(n.id))
      .forEach(n => {
        console.log('publishing', n.id.toString());
        this.emit(n, NodeChangeType.update)
      });
    console.groupEnd();
  }

  private updateSelection(cb: Function) {
    const selection = this.state.selection;
    // console.debug("syncing: selection", this.state.selection.toJSON(), this.state.selection.isInline);
    if (!this.app.ready) {
      // console.log('react not ready');
      return;
    }

    // this.react.enable();

    if (selection.isInline) {
      this.syncSelection();
    }
    this.app.emit(EventsOut.selectionUpdated, this.state.selection);
    cb();

    // process pending transactions
    // this.tm.Dispatch();
    // console.groupEnd();
  }

  // syncs DOM selection with Editor's internal selection state
  // this must be called after the dom is updated
  private syncSelection() {
    try {
      // console.log('syncSelection', this.state.selectionOrigin, this.state.selection.toString()	);
      if (!this.app.enabled) {
        console.log("skipped: selection sync disabled");
        return;
      }

      if (!this.state.isSelectionChanged) {
        console.log("skipped: selection already synced", this.state.selection.origin, this.state.selection.toString());
        return;
      }

      const { app } = this;
      const { selection } = this.state;
      if (!this.state.isSelectionChanged && selection.origin === ActionOrigin.DomSelectionChange) {
        console.log("skipped: unchanged selection sync", selection.origin, selection.toString());
        return;
      }

      if (selection.isInvalid) {
        console.warn("skipped invalid selection sync");
        app.element?.blur();
        return;
      }

      selection.syncDom(app.store);
    } catch (error) {
      this.promiseState.reject?.(error);
    }
  }

}
