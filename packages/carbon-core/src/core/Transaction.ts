import { Optional, With } from "@emrgen/types";
import dayjs from "dayjs";
import { flatten, identity, isArray, isFunction } from "lodash";
import { insertNodesActions } from "../utils/action";
import {
  ChangeNameAction,
  MoveNodeAction,
  RemoveNodeAction,
  SelectAction,
  SetContentAction,
  UpdateMarkAction,
  UpdatePropsAction,
} from "./actions/index";
import { ActionOrigin, CarbonAction, TxType } from "./actions/types";
import { NodeIdSet } from "./BSet";
import { NodeBTree } from "./BTree";
import { Carbon } from "./Carbon";
import { CarbonCommand, PluginCommand } from "./CarbonCommand";
import { Draft } from "./Draft";
import { p14 } from "./Logger";
import { Mark } from "./Mark";
import { Node } from "./Node";
import { IntoNodeId, NodeId } from "./NodeId";
import { ActivatedPath, NodePropsJson, SelectedPath } from "./NodeProps";
import { PinnedSelection } from "./PinnedSelection";
import { PluginManager } from "./PluginManager";
import { Point } from "./Point";
import { PointedSelection } from "./PointedSelection";
import { SelectionManager } from "./SelectionManager";
import { TransactionManager } from "./TransactionManager";
import { cloneFrozenNode, NodeName } from "./types";

let _id = 0;
const getId = () => String(_id++);

export class Transaction {
  time = dayjs().unix();
  type: TxType = TxType.TwoWay;
  readonly id: string;
  private actions: CarbonAction[] = [];
  lastSelection: PointedSelection;

  // track the end and start block of the transaction
  // this is useful for combining multiple actions like delete -> insert, delete -> paste
  startNode: Optional<Node>;
  endNode: Optional<Node>;

  private _committed: boolean = false;
  private _dispatched: boolean = false;

  private readOnly = false;

  get dispatched() {
    return this._dispatched;
  }

  get committed() {
    return this._committed;
  }

  get origin() {
    return this.app.runtime.origin;
  }

  get size() {
    return this.actions.length;
  }

  get state() {
    return this.app.state;
  }

  get store() {
    return this.app.store;
  }

  get textInsertOnly() {
    return this.actions.every(
      (a) => a instanceof SetContentAction || a instanceof SelectAction,
    );
  }

  get selectionOnly() {
    return this.actions.every((a) => a instanceof SelectAction);
  }

  static create(
    carbon: Carbon,
    cmd: CarbonCommand,
    tm: TransactionManager,
    pm: PluginManager,
    sm: SelectionManager,
  ) {
    return new Transaction(carbon, cmd, tm, pm, sm);
  }

  constructor(
    readonly app: Carbon,
    readonly cmd: CarbonCommand,
    protected readonly tm: TransactionManager,
    protected readonly pm: PluginManager,
    protected readonly sm: SelectionManager,
  ) {
    this.id = getId();
    this.lastSelection = this.app.selection.unpin();
  }

  get isEmpty() {
    return this.actions.length === 0;
    // return this.actions.length === 0 || this.actions.filter(a => a instanceof SelectAction).every(a => {
    // 	const select = a as SelectAction;
    // 	return select.before.eq(select.after) && select.before.isBlock && select.after.isBlock;
    // });
  }

  SetStartNode(node: Node) {
    this.startNode = node;
  }

  SetEndNode(node: Node) {
    this.endNode = node;
  }

  // removes old selection if any and selects new selection
  // internally it creates update props action for new selection and old deselection
  SelectBlocks(nodeIds: NodeId[], origin = this.origin): Transaction {
    const { blockSelection } = this.state;
    const blocks = NodeBTree.from(blockSelection.blocks);
    const old = NodeIdSet.fromIds(blockSelection.blocks.map((n) => n.id));
    const now = NodeIdSet.fromIds(nodeIds);

    // find removed block selection
    const removed = old
      .diff(now)
      .map((id) => blocks.get(id))
      .map((v) => v)
      .filter(identity) as Node[];
    this.deselectNodes(removed);

    // find new block selection
    now.diff(old).forEach((id) => {
      this.selectNodes(id, origin);
    });

    // console.log(
    //   "SelectBlocks",
    //   nodeIds.map((id) => id.toString()),
    // );
    // console.log("old", old.toString());
    // console.log("now", now.toString());

    return this;
  }

  Select(
    selection: PinnedSelection | PointedSelection,
    origin = this.origin,
  ): Transaction {
    const after = selection.unpin();
    this.lastSelection = after;
    after.origin = origin;
    return this.Add(
      SelectAction.create(this.state.selection.unpin(), after, origin),
    );
  }

  // can be called for textContainer only
  SetContent(
    nodeRef: IntoNodeId,
    after: Node[] | string,
    origin = this.origin,
  ): Transaction {
    if (isArray(after)) {
      after = after.map(cloneFrozenNode);
    }

    return this.Add(SetContentAction.create(nodeRef, after, origin));
  }

  Insert(at: Point, nodes: Node | Node[], origin = this.origin): Transaction {
    const insertNodes = isArray(nodes) ? nodes : [nodes];
    return this.Add(insertNodesActions(at, insertNodes, origin));
  }

  Remove(at: Point, ref: IntoNodeId, origin = this.origin): Transaction {
    return this.Add(RemoveNodeAction.fromNode(at, ref.nodeId(), origin));
  }

  Move(
    from: Point,
    to: Point,
    ref: IntoNodeId,
    origin = this.origin,
  ): Transaction {
    return this.Add(MoveNodeAction.create(from, to, ref.nodeId(), origin));
  }

  Change(ref: NodeId | Node, to: NodeName, origin = this.origin): Transaction {
    return this.Add(ChangeNameAction.create(ref.nodeId(), to, origin));
  }

  Mark(
    action: "add" | "remove",
    mark: Mark | Mark[],
    origin = this.origin,
  ): Transaction {
    if (isArray(mark)) {
      mark.forEach((m) => this.Add(UpdateMarkAction.create(action, m, origin)));
      return this;
    }

    return this.Add(UpdateMarkAction.create(action, mark, origin));
  }

  Update(
    nodeRef: IntoNodeId,
    props: Partial<NodePropsJson>,
    origin = this.origin,
  ): Transaction {
    this.Add(UpdatePropsAction.create(nodeRef, props, origin));
    return this;
  }

  // previously selected nodes will be deselected
  // previously active nodes will be deactivated
  private selectNodes(
    ids: NodeId | NodeId[] | Node[],
    origin = this.origin,
  ): Transaction {
    const selectIds = ((isArray(ids) ? ids : [ids]) as IntoNodeId[]).map((n) =>
      n.nodeId(),
    );

    selectIds.forEach((id) => {
      this.Update(id, { [SelectedPath]: true }, origin);
    });

    return this;
  }

  private deselectNodes(nodes: Node[], origin = this.origin): Transaction {
    nodes.forEach((node) => {
      if (node.props.get(SelectedPath)) {
        this.Update(node.id, { [SelectedPath]: false }, origin);
      }
    });

    return this;
  }

  private activateNodes(
    ids: NodeId | NodeId[] | Node[],
    origin = this.origin,
  ): Transaction {
    const activateIds = ((isArray(ids) ? ids : [ids]) as IntoNodeId[]).map(
      (n) => n.nodeId(),
    );
    activateIds.forEach((id) => {
      this.Update(id, { [ActivatedPath]: true }, origin);
    });

    return this;
  }

  private deactivateNodes(
    ids: NodeId | NodeId[] | Node[],
    origin = this.origin,
  ): Transaction {
    const activateIds = ((isArray(ids) ? ids : [ids]) as IntoNodeId[]).map(
      (n) => n.nodeId(),
    );
    activateIds.forEach((id) => {
      this.Update(id, { [ActivatedPath]: false }, origin);
    });

    return this;
  }

  WithType(type: TxType): Transaction {
    this.type = type;
    return this;
  }

  // adds command to transaction
  Add(action: CarbonAction | CarbonAction[]): Transaction {
    if (this.dispatched) {
      throw new Error(
        "can not add actions to dispatched transaction: " + this.id,
      );
    }

    flatten([action]).forEach((a) => this.actions.push(a));
    return this;
  }

  // TODO: transaction should be immutable before dispatch
  Dispatch(): Transaction {
    if (this.actions.length === 0) {
      console.warn("skipped: empty transaction");
      return this;
    }

    // check one transaction can have only one select action
    const selectActions = this.actions.filter((a) => a instanceof SelectAction);
    if (selectActions.length > 1) {
      throw new Error("transaction can have only one select action");
    }

    // if there is no select action, add a skip select action
    // this is useful for transaction that only updates the content and want to blur the selection
    if (selectActions.length === 0) {
      // this.Select(PinnedSelection.SKIP);
    }

    if (this._dispatched) {
      console.warn("skipped: transaction already dispatched");
      return this;
    }
    this._dispatched = true;

    // console.groupCollapsed('dispatching transaction')
    // this.actions.forEach(ac => {
    //   console.log(ac.toString())
    // })
    // console.groupEnd();

    // console.log(
    //   "dispatching transaction",
    //   this.id,
    //   this.actions.map((a) => a.toString()),
    // );
    this.tm.dispatch(this);
    return this;
  }

  // Commit applies changes to the draft
  Commit(draft: Draft) {
    if (this.actions.length === 0) return this;
    if (this._committed) {
      console.warn("skipped: transaction already committed");
      return this;
    }
    // const prevDocVersion = editor.doc?.updateCount;

    try {
      if (this.actions.every((c) => c.origin === ActionOrigin.Runtime)) {
        console.group("Commit (runtime)");
      } else {
        console.groupCollapsed("Commit", this.id, this);
      }

      for (const action of this.actions) {
        console.log(p14("%c[command]"), "color:white", action.toString());
        try {
          action.execute(draft);
        } catch (e) {
          console.log(e);
        }
      }
      // normalize after transaction command
      // this way the merge will happen before the final selection
      // this.normalizeNodes(draft);
    } catch (error) {
      console.error(error);
      throw Error("transaction error");
    } finally {
      console.groupEnd();
      this._committed = true;
    }
  }

  // merge transactions
  // merge(other: Transaction) {
  // 	const {actions} = this;
  // 	const {actions: otherActions} = other;
  // 	if (this.textInsertOnly && other.textInsertOnly) {
  // 		const { tr } = this.react
  // 		const thisSetContentAction = first(actions) as SetContentAction
  // 		const otherSetContentAction = first(actions) as SetContentAction
  //
  // 		const thisSelectAction = last(actions) as SelectAction
  // 		const otherSelectAction = last(actions) as SelectAction
  //
  // 		tr
  // 			.Add(thisSetContentAction.merge(otherSetContentAction))
  // 			.Add(thisSelectAction.merge(otherSelectAction))
  // 		return tr
  // 	}
  // 	// if (last(this.actions) instanceof SelectCommand) {
  // 	// 	this.pop()
  // 	// }
  //
  // 	// this.actions.push(...tr.actions);
  // 	// this.selections.push(...tr.selections);
  // 	return other;
  // }

  // extend transaction with other transaction
  // extend(other: Transaction) {
  // 	other.actions.forEach(action => {
  // 		this.actions.push(action);
  // 	})
  //
  // 	return this;
  // }

  Then(cb: With<Transaction>): Transaction {
    this.app.nextTick(cb);
    return this;
  }

  Pop() {
    return this.actions.pop();
  }

  // TODO: generate a chain transaction object with all the actions precomputed
  // this way we can check for method conflicts and raise error before the application starts
  Proxy(): Transaction {
    const self = this;
    const proxy = new Proxy(self, {
      get: (target, prop) => {
        const propName = prop.toString();
        if (prop === "isProxy") {
          return true;
        }

        if (Reflect.has(target, prop)) {
          if (["Pop"].includes(propName)) {
            return Reflect.get(target, prop);
          } else {
            const part = Reflect.get(target, prop);
            if (isFunction(part)) {
              return (...args: any) => {
                part.bind(self)(...args);
                return proxy;
              };
            } else {
              return part;
            }
          }
        }

        const cmd = target.cmd.command(propName);

        if (cmd) {
          return (...args: any) => {
            // console.log(`2. calling ${propName}.${cmd.fn.name}`);
            cmd.fn(proxy, ...args);
            return proxy;
          };
        }

        const plugin = target.cmd.plugin(propName);

        if (!plugin) {
          throw new Error(`Plugin ${propName} not found`);
        }

        return PluginCommand.from(proxy, propName, plugin).proxy();
      },
    });

    return proxy;
  }

  Discard() {
    this.app.committed = true;
    Object.freeze(this.actions);
  }

  Into() {
    const { type, id, actions, origin, dispatched, committed } = this;
    return {
      type,
      id,
      actions,
      origin,
      dispatched,
      committed,
    };
  }
}
