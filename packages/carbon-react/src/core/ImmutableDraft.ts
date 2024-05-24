import {
  ActionOrigin,
  BlockSelection,
  ChangeNameAction,
  Draft,
  EmptyPlaceholderPath,
  FocusedPlaceholderPath,
  HasFocusPath,
  InsertChange,
  InsertNodeAction,
  isPassiveHidden,
  LinkChange,
  Mark,
  MarkAction,
  MarkSet,
  MarksPath,
  MoveNodeAction,
  MutableNode,
  NameChange,
  Node,
  NodeId,
  NodeIdSet,
  nodeLocation,
  NodePropsJson,
  NodeType,
  p14,
  Pin,
  PlaceholderPath,
  PluginManager,
  Point,
  PointAt,
  PointedSelection,
  RemoveChange,
  RemoveNodeAction,
  Schema,
  SelectAction,
  SelectedPath,
  SelectionChange,
  SetContentAction,
  SetContentChange,
  sortNodesByDepth,
  State as CoreState,
  StateActions,
  StateChanges,
  StateScope,
  TextChange,
  TxType,
  UpdateChange,
  UpdatePropsAction,
} from "@emrgen/carbon-core";
import { Optional } from "@emrgen/types";
import { ImmutableState } from "./ImmutableState";
import { first, isArray, isEmpty, isEqual, isString, reduce } from "lodash";
import { ImmutableNodeMap } from "./ImmutableNodeMap";

enum UpdateDependent {
  None = 0,
  Prev = 1,
  Next = 2,
  Parent = 4,
}

// NOTE: it is internal to the state and actions. it should not be used outside of it.
//draft of a state is used to prepare a new state before commit
export class ImmutableDraft implements Draft {
  private readonly state: ImmutableState;

  schema: Schema;
  marks: MarkSet;

  private readonly nodeMap: ImmutableNodeMap;

  private origin: ActionOrigin;
  private pm: PluginManager;
  private selection: PointedSelection;

  private selected: NodeIdSet = NodeIdSet.empty();
  private updated: NodeIdSet; // tracks changed nodes
  private contentChanged: NodeIdSet = NodeIdSet.empty(); // tracks nodes with content changes
  private unstable: NodeIdSet = NodeIdSet.empty();

  private readonly changes: StateChanges;
  private readonly actions: StateActions;

  private tm: Transformer;

  private drafting = true;

  constructor(
    state: ImmutableState,
    origin: ActionOrigin,
    type: TxType,
    pm: PluginManager,
    schema: Schema,
    marks: MarkSet,
  ) {
    this.origin = origin;
    this.state = state;
    this.pm = pm;
    this.changes = new StateChanges();
    this.actions = new StateActions([], type);
    this.tm = new Transformer(this.changes, this.actions);
    this.schema = schema;
    this.marks = marks.clone();
    this.nodeMap = ImmutableNodeMap.from(state.nodeMap);
    this.updated = new NodeIdSet();
    this.selection = state.selection.unpin(origin);
    state.blockSelection.blocks.forEach((n) => this.selected.add(n.id));
  }

  private addContentChanged(id: NodeId) {
    if (this.nodeMap.isDeleted(id)) {
      return;
    }
    this.contentChanged.add(id);
    // if the node is not deleted, add it to the unstable list
    // there is no need to stabilize deleted nodes
    console.log("UNSTABLE", id.toString());
    this.unstable.add(id);
  }

  private addUpdated(id: NodeId) {
    this.updated.add(id);
  }

  private removeUpdated(id: NodeId) {
    this.updated.remove(id);
  }

  private addInserted(node: Node) {
    this.nodeMap.set(node.id, node);
  }

  private addRemoved(id: NodeId) {
    console.log("Removing node", id.toString());
    this.nodeMap.delete(id);
  }

  get(id: NodeId): Optional<Node> {
    return this.nodeMap.get(id);
  }

  parent(from: NodeId | Node): Optional<Node> {
    return this.nodeMap.parent(from);
  }

  // produce a new state from the draft
  produce(fn: (producer: ImmutableDraft) => void): CoreState {
    const { scope } = this.state;
    try {
      // console.log('[SCOPE]', scope.toString())
      StateScope.put(scope, this.nodeMap);
      StateScope.set(scope);

      // update the draft
      fn(this);

      // commit the draft with the updated node map
      const state = this.commit(3);
      StateScope.put(scope, state.nodeMap);

      this.dispose();
      return state;
    } catch (e) {
      StateScope.put(scope, this.state.nodeMap);
      console.error(e);
      this.dispose();
      return this.state;
    }
  }

  // turn the draft into a new state
  private commit(depth: number): ImmutableState {
    this.prepare();

    const { state, updated, selection, marks } = this;

    const nodeMap =
      this.nodeMap.current.size === 0 ? state.nodeMap : this.nodeMap;
    // as the root node is always same id, we can get the root node by id
    const content = this.nodeMap.get(this.state.content.id);

    if (!content) {
      throw new Error("Cannot commit draft with invalid content");
    }

    // create a new selection based on the new node map using the draft selection
    const after = selection.pin(this.nodeMap);
    if (!after) {
      console.error(
        selection.toString(),
        this.nodeMap.get(selection.head.nodeId)?.textContent,
      );
      throw new Error("Cannot commit draft with invalid pinned selection");
    }

    // console.log('updated state', updated.toArray().map(n => n.toString()).join(', '))
    updated.freeze();
    nodeMap.contracts(2);
    nodeMap.freeze();
    after.freeze();
    marks.freeze();

    const selected = this.selected.nodes(this.nodeMap);
    const blockSelection = BlockSelection.create(selected);

    const newState = new ImmutableState({
      previous: state.clone(depth - 1),
      scope: state.scope,
      content,
      selection: after,
      blockSelection,
      nodeMap,
      updated: updated,
      changes: this.changes.optimize(),
      actions: this.actions.optimize(),
      marks,
    });

    return newState.freeze();
  }

  // prepare the draft for commit
  // transaction updates the node map to reflect the changes
  // prepare will create a new node map and tree with all the changes applied
  prepare() {
    if (!this.drafting) {
      throw new Error("Cannot prepare a draft that is already committed");
    }

    // remove deleted nodes from unstable node before normalization
    this.unstable.toArray().forEach((id) => {
      if (this.nodeMap.isDeleted(id)) {
        this.unstable.remove(id);
      }
    });

    this.normalize();
    this.updateSelectionProps();

    if (!this.state.selection.unpin().eq(this.selection)) {
      this.collectMarks();
    }

    // remove deleted nodes from changed list
    // this will prevent from trying to render deleted nodes
    this.updated.toArray().forEach((id) => {
      // console.log('checking deleted', id.toString(), this.nodeMap.deleted(id));
      if (this.nodeMap.isDeleted(id)) {
        this.removeUpdated(id);
      }

      // remove the hidden nodes
      this.node(id, (node) => {
        if (isPassiveHidden(node) || node.isCollapseHidden) {
          console.debug("removing hidden node", node.name, node.id.toString());
          this.removeUpdated(id);
        }
      });
    });

    // console.log('updated', this.updated.toArray().map(n => n.toString()).join(', '))
    const dirty = this.updated.clone();
    this.updated.nodes(this.nodeMap).forEach((node) => {
      node.parents.forEach((parent) => {
        dirty.add(parent.id);
      });
    });

    dirty.nodes(this.nodeMap).forEach((node) => {
      node.renderVersion += 1;
    });

    this.contentChanged.nodes(this.nodeMap).forEach((node) => {
      const { chain } = node;
      if (chain.some((n) => this.nodeMap.isDeleted(n.id))) {
        this.contentChanged.remove(node.id);
        return;
      }

      chain.forEach((parent) => {
        this.contentChanged.add(parent.id);
      });
    });

    this.contentChanged.nodes(this.nodeMap).forEach((node) => {
      node.contentVersion += 1;
    });

    return this;
  }

  // WARNING: inefficient implementation for validation of ideas only
  private normalize() {
    console.debug(
      "unstable nodes",
      this.unstable
        .toArray()
        .map((n) => n.toString())
        .join(", "),
    );
    const unstable = this.unstable.nodes(this.nodeMap);
    const nodes = sortNodesByDepth(unstable).reverse();
    const node = first(nodes);
    if (!node) {
      console.warn("no unstable node not found");
      return;
    }

    const actions = this.pm.normalize(node);
    if (!isEmpty(actions)) {
      console.debug("normalizing", node.name, node.id.toString(), actions);
      actions.forEach((action) => {
        action.execute(this);
      });

      console.log(
        actions,
        actions.map((a) => a.toString()),
        "actions normalized",
      );
    }

    this.unstable.remove(node.id);
    if (this.unstable.size > 0) {
      this.normalize();
      return;
    }

    this.normalizeSchema();
  }

  // normalize unstable nodes by inserting missing nodes as per the schema
  private normalizeSchema() {
    console.debug("normalizing schema");
    // this.contentChanged.nodes(this.nodeMap).forEach(node => {
    //   const nodes: Node[] = []
    //   node.all(n => {
    //     if (n.isTextContainer) {
    //       nodes.push(n)
    //     }
    //   })
    //
    //   nodes.forEach(n => {
    //     if (n.isVoid) {
    //       const textNode = this.schema.text('')!;
    //       const action = SetContentAction.create(n.id, [textNode]);
    //       action.execute(this);
    //       console.log('normalizing void node', n.name, n.id.toString())
    //     }
    //   })
    // })
  }

  updateContent(nodeId: NodeId, content: Node[] | string) {
    if (!this.drafting) {
      throw new Error(
        "Cannot update content on a draft that is already committed",
      );
    }

    const node = this.unfreeze(nodeId);
    // if the node is already deleted, skip the update
    if (this.nodeMap.isDeleted(nodeId)) {
      return;
    }

    node.descendants().forEach((n) => this.addRemoved(n.id));

    // update state
    this.tm.updateContent(node, content);

    if (isArray(content)) {
      node.descendants().forEach((n) => this.addInserted(n));
    }

    console.log(content, node.textContent, node.renderVersion);

    this.addUpdated(nodeId);
    this.addContentChanged(nodeId);

    // for text container update empty placeholder
    if (node.isTextContainer && isArray(content)) {
      this.tm.updateProps(node, {
        [PlaceholderPath]:
          content.length === 0
            ? this.nodeMap
                .parent(node)
                ?.props.get<string>(EmptyPlaceholderPath) ?? ""
            : " ",
      });
    }

    // for text node update empty placeholder of parent title
    if (node.isText && isString(content)) {
      const { parent } = node;
      if (!parent) return;
      const updated = this.tm.updateProps(parent, {
        [PlaceholderPath]:
          content.length === 0
            ? this.nodeMap
                .parent(parent)
                ?.props.get<string>(EmptyPlaceholderPath) ?? ""
            : " ",
      });
      // if (updated) {
      this.addUpdated(parent.id);
      // }
    } else if (node.isTextContainer && isArray(content)) {
      const oldChildren = node.children;
      const newChildren = content;
      oldChildren.forEach((n) => this.changes.dataMap.set(n.id, n.data));
      newChildren.forEach((n) => this.changes.dataMap.set(n.id, n.data));
      const nodeIdSet = new NodeIdSet();
      newChildren.forEach((n) => nodeIdSet.add(n.id));
      oldChildren.forEach((n) => {
        if (!nodeIdSet.has(n.id)) {
          console.log("REMOVING", n.id.toString());
          this.addRemoved(n.id);
        }
      });
      newChildren.forEach((n) => {
        this.addInserted(n);
        console.log("INSERTED", n.id.toString());
      });
      this.addUpdated(nodeId);
    }
  }

  insertText(at: Point, text: string) {
    const { marks } = this;
    const { nodeId, offset } = at;
    const node = this.nodeMap.get(nodeId);
    if (!node) {
      throw new Error("Cannot insert text to a node that does not exist");
    }

    if (node.isTextContainer) {
      if (node.isEmpty) {
        // insert an empty text node with the text
        const textNode = node.type.schema.text(text)!;
        this.updateContent(node.id, [textNode]);
      } else {
        console.log(
          "INSERTING TEXT",
          text,
          offset,
          node.textContent,
          marks.toString(),
        );

        // find text node and insert text at the offset
        // if the marks match with the text node, insert the text only
        // otherwise split the text node and insert the text with the marks

        const pin = Pin.fromPoint(at, this.nodeMap);
        const down = pin?.down();
        if (!down) {
          throw new Error("Cannot insert text to a node that does not exist");
        }

        console.log(
          "CURRENT NODE",
          down.node.name,
          down.node.textContent,
          down.node.props.get(MarksPath, []),
        );
        console.log("CURRENT MARKS", marks.toString());

        const { textContent } = node;
        // FIXME: find the correct child with offset
        const newText =
          textContent.slice(0, offset) + text + textContent.slice(offset);
        const textNode = node.firstChild!;
        debugger;

        this.updateContent(textNode.id, newText);
      }
    }
  }

  insert(at: Point, node: Node) {
    this.insertBy(at, node, "create");
  }

  move(to: Point, nodeId: NodeId) {
    if (!this.drafting) {
      throw new Error("Cannot move node to a draft that is already committed");
    }

    // allow no op move without altering index.
    const inode = this.node(nodeId);
    const at = nodeLocation(inode);
    if (at?.eq(to)) {
      console.warn("no op move detected, check origin");
      return;
    }

    // if the node is already deleted, skip the move
    if (this.nodeMap.isDeleted(nodeId)) {
      return;
    }

    const node = this.unfreeze(nodeId);
    const { parent } = node;
    if (!parent) {
      throw new Error("Cannot move node that does not have a parent");
    }

    this.actions.add(MoveNodeAction.create(nodeLocation(node)!, to, nodeId));

    this.updateDependents(node, UpdateDependent.Next);

    this.tm.remove(node, parent);
    node.setParentId(null);

    this.addUpdated(parent.id);
    this.addContentChanged(parent.id);

    this.insertBy(to, node, "move");
  }

  private insertBy(at: Point, node: Node, type: "create" | "move" = "create") {
    if (!this.drafting) {
      throw new Error(
        "Cannot insert node to a draft that is already committed",
      );
    }
    // NOTE: this will skip insertion w.r.t. the deleted nodes
    if (this.nodeMap.isDeleted(at.nodeId)) {
      node.all((n) => this.addRemoved(n.id));
      return;
    }

    //
    if (type === "create") {
      this.actions.add(InsertNodeAction.create(at, node.id, node.toJSON()));
    }

    // mark moved/inserted nodes as inserted ones
    // these will not be rendered explicitly
    node.all((n) => this.addInserted(n));

    // console.debug('inserting new item')
    switch (at.at) {
      case PointAt.Before:
        this.insertBefore(at.nodeId, node);
        break;
      case PointAt.After:
        this.insertAfter(at.nodeId, node);
        break;
      case PointAt.Start:
        this.prepend(at.nodeId, node);
        break;
      case PointAt.End:
        this.append(at.nodeId, node);
        break;
    }
  }

  private insertBefore(refId: NodeId, node: Node) {
    const refNode = this.nodeMap.get(refId);
    if (!refNode) {
      throw new Error("Cannot insert node before a node that does not exist");
    }

    const parentId = refNode.parentId;
    if (!parentId) {
      throw new Error(
        "Cannot insert node before a node that does not have a parent",
      );
    }
    const parent = this.unfreeze(parentId);
    this.tm.insert(node, parent, refNode.index);
    this.addUpdated(parent.id);
    this.addContentChanged(parent.id);
    const block = node.closestBlock;
    this.updatePlaceholder(block.parent!, block, EmptyPlaceholderPath);
  }

  private insertAfter(refId: NodeId, node: Node) {
    const refNode = this.node(refId);
    if (!refNode) {
      throw new Error("Cannot insert node before a node that does not exist");
    }
    console.log(
      "[render version]",
      refNode.id.toString(),
      refNode.renderVersion,
    );

    const parentId = refNode.parentId;
    if (!parentId) {
      throw new Error(
        "Cannot insert node before a node that does not have a parent",
      );
    }

    const parent = this.unfreeze(parentId);
    this.tm.insert(node, parent, refNode.index + 1);
    this.updateDependents(node, UpdateDependent.Next);
    this.addUpdated(parent.id);
    this.addContentChanged(parent.id);
    const block = node.closestBlock;
    this.updatePlaceholder(block.parent!, block, EmptyPlaceholderPath);
  }

  private prepend(parentId: NodeId, node: Node) {
    const parent = this.unfreeze(parentId);
    this.tm.insert(node, parent, 0);
    this.addUpdated(parent.id);
    this.addContentChanged(parent.id);
    // if parent title is empty, set placeholder from parent
    const block = parent.closestBlock;
    this.updatePlaceholder(block.parent!, block, EmptyPlaceholderPath);
  }

  private append(parentId: NodeId, node: Node) {
    const parent = this.unfreeze(parentId);
    this.tm.insert(node, parent, parent.size);
    this.addUpdated(parent.id);
    this.addContentChanged(parent.id);

    // if parent title is empty, set placeholder from parent
    const block = parent.closestBlock;
    this.updatePlaceholder(block.parent!, block, EmptyPlaceholderPath);
  }

  // update the placeholder of the target node based on the source node placeholder
  private updatePlaceholder(
    source: Node,
    target: Optional<Node>,
    path: string = EmptyPlaceholderPath,
  ) {
    const placeholder = source.props.get<string>(path) ?? " ";
    if (target) {
      if (path === EmptyPlaceholderPath) {
        this.tm.updateProps(target, {
          [PlaceholderPath]: source.firstChild?.isEmpty ? placeholder : " ",
        });
      } else {
        this.tm.updateProps(target, {
          [PlaceholderPath]: placeholder,
        });
      }
    }
  }

  remove(nodeId: NodeId) {
    if (!this.drafting) {
      throw new Error(
        "Cannot remove node from a draft that is already committed",
      );
    }

    if (this.nodeMap.isDeleted(nodeId)) {
      console.log("node is already deleted", nodeId.toString());
      return;
    }

    const node = this.unfreeze(nodeId);
    const parentId = node.parentId;
    if (!parentId) {
      throw new Error("Cannot remove node that does not have a parent");
    }

    this.actions.add(
      RemoveNodeAction.create(nodeLocation(node)!, nodeId, node.toJSON()),
    );

    const { parent } = node;
    if (!parent) {
      throw new Error("Cannot remove node that does not have a parent");
    }

    this.tm.remove(node, parent);

    this.addUpdated(parent.id);
    this.addContentChanged(parent.id);
    node.all((n) => this.addRemoved(n.id));

    // if parent title is empty, set placeholder from parent
    if (parent.isTextContainer && parent.isEmpty) {
      const placeholder =
        parent.parent?.props.get<string>(EmptyPlaceholderPath) ?? " ";
      this.tm.updateProps(parent, {
        [PlaceholderPath]: placeholder,
      });
    }
  }

  change(nodeId: NodeId, type: NodeType) {
    if (!this.drafting) {
      throw new Error(
        "Cannot change name on a draft that is already committed",
      );
    }

    const node = this.unfreeze(nodeId);
    // if the node is already deleted, skip the change
    if (this.nodeMap.isDeleted(nodeId)) {
      return;
    }

    this.actions.add(
      ChangeNameAction.withBefore(nodeId, node.type.name, type.name),
    );

    this.updateDependents(node, UpdateDependent.Next);
    this.tm.changeType(node, type);

    if (node.isContainer && node.firstChild?.isEmpty) {
      const firstChild = this.unfreeze(node.firstChild.id);
      this.tm.updateProps(firstChild, {
        [PlaceholderPath]: type.props.get<string>(EmptyPlaceholderPath) ?? "",
      });
    }

    this.addUpdated(node.id);
  }

  updateProps(nodeId: NodeId, props: Partial<NodePropsJson>) {
    if (!this.drafting) {
      throw new Error(
        "Cannot change name on a draft that is already committed",
      );
    }

    if (this.nodeMap.isDeleted(nodeId)) {
      console.debug("node is deleted", nodeId.toString());
      this.selected.remove(nodeId);
      return;
    }

    const node = this.unfreeze(nodeId);
    console.log(
      "parent",
      node.parentId?.toString(),
      node.parent?.name,
      node.parent?.id.toString(),
    );

    this.tm.updateProps(node, props);
    console.log("[render version]", node.id.toString(), node.renderVersion);
    this.addUpdated(node.id);

    if (props[SelectedPath] === true) {
      this.selected.add(nodeId);
    }

    if (props[SelectedPath] !== true) {
      this.selected.remove(nodeId);
    }
  }

  updateMark(action: MarkAction, mark: Mark): void {
    if (!this.drafting) {
      throw new Error(
        "Cannot update mark on a draft that is already committed",
      );
    }

    const { marks } = this;
    switch (action) {
      case "add":
        marks.add(mark);
        break;
      case "remove":
        marks.remove(mark);
        break;
      default:
        throw new Error("Invalid mark action");
    }
  }

  updateSelection(selection: PointedSelection) {
    if (!this.drafting) {
      throw new Error(
        "Cannot update selection on a draft that is already committed",
      );
    }

    // console.log("update selection", selection.isInline);
    this.selection = selection;
    const before = this.state.selection.unpin();
    this.changes.add(SelectionChange.create(before, selection));
    this.actions.add(SelectAction.create(before, selection));
  }

  // update selected node props
  private updateSelectionProps() {
    const selection = this.selection;
    // update empty placeholder of the previous head node
    if (this.state.selection.isCollapsed) {
      if (!this.state.selection.isInvalid) {
        const { head } = this.state.selection.unpin();
        if (!this.nodeMap.isDeleted(head.nodeId)) {
          const node = this.unfreeze(head.nodeId);
          if (!node) {
            throw new Error(
              "Cannot update selection on a draft that is already committed",
            );
          }

          if (node.isEmpty) {
            const { parent } = node;
            if (!parent) return;
            node.updateProps({
              [PlaceholderPath]:
                parent.props.get<string>(EmptyPlaceholderPath) ?? " ",
            });
            console.log(
              "updated empty placeholder",
              node.key,
              parent.props.get<string>(EmptyPlaceholderPath),
              parent.name,
            );
            this.addUpdated(node.id);
          }
        }
      }
    }

    // update focus placeholder of the current head node
    if (selection.isCollapsed && !selection.isInvalid) {
      const { head } = selection;
      if (this.nodeMap.isDeleted(head.nodeId)) return;

      const node = this.unfreeze(head.nodeId);
      if (!node) {
        throw new Error(
          "Cannot update selection on a draft that is already committed",
        );
      }

      if (node.isEmpty) {
        const { parent } = node;
        if (!parent) return;
        node.updateProps({
          [PlaceholderPath]:
            parent.props.get<string>(FocusedPlaceholderPath) ?? " ",
        });
        this.addUpdated(node.id);
      }
    }

    // update focus marker if needed
    if (this.state.selection.tail.node.id.eq(this.selection.tail.nodeId)) {
      return;
    }

    if (!this.state.selection.isInvalid) {
      const { tail } = this.state.selection.unpin();
      if (!this.nodeMap.isDeleted(tail.nodeId)) {
        const node = this.unfreeze(tail.nodeId);
        if (this.nodeMap.isDeleted(node.id)) return;
        node.updateProps({
          [HasFocusPath]: "",
        });
        this.addUpdated(node.id);
      }
    }

    // console.log('Selection', this.selection.head.eq(Point.IDENTITY))
    if (!this.selection.isInvalid) {
      const node = this.unfreeze(this.selection.tail.nodeId);
      node.updateProps({
        [HasFocusPath]: true,
      });
      this.addUpdated(node.id);
    }
  }

  private collectMarks() {
    const { selection } = this;
    const pinnedSelection = selection.pin(this.nodeMap);
    if (!pinnedSelection) {
      console.error("pinned selection is invalid", selection.toString());
      return;
    }

    // collect marks from the selection
    const { start } = pinnedSelection;
    const downPin = start.down();
    console.info("down pin", downPin.toString());
    console.info(downPin.node.props.get(MarksPath, []));
    const marks = downPin.node.marks;
    this.marks = MarkSet.from(marks);
  }

  // check and update render dependents
  private updateDependents(node: Node, flag: number) {
    if (
      flag & UpdateDependent.Parent &&
      node.parent?.type.spec.depends?.child
    ) {
      const parentId = node.parent?.id;
      if (!parentId) return;
      const parent = this.unfreeze(parentId);
      this.addUpdated(parent.id);
      this.updateDependents(parent, UpdateDependent.Parent);
    }

    // console.log('update prev', flag, node.id.toString(), node.prevSibling?.type.spec.depends?.prev)
    if (
      flag & UpdateDependent.Prev &&
      node.prevSibling?.type.spec.depends?.next
    ) {
      const prevId = node.prevSibling?.id;
      if (!prevId) return;
      const prev = this.unfreeze(prevId);
      this.addUpdated(prev.id);
      this.updateDependents(prev, UpdateDependent.Prev);
    }

    // console.log('update next', flag, node.id.toString(), node.nextSibling?.type.spec.depends?.prev)
    if (
      flag & UpdateDependent.Next &&
      node.nextSibling?.type.spec.depends?.prev
    ) {
      const nextId = node.nextSibling?.id;
      if (!nextId) return;
      const next = this.unfreeze(nextId);
      this.addUpdated(next.id);
      this.updateDependents(next, UpdateDependent.Next);
    }
  }

  private unfreeze(id: NodeId): MutableNode {
    const node = this.node(id);
    if (!Object.isFrozen(node)) {
      return node as MutableNode;
    }

    const root = this.nodeMap.get(NodeId.ROOT);
    if (!root) {
      throw new Error("Cannot mutate node that does not exist");
    }

    const { path } = node;
    root.unfreeze(path, this.nodeMap);

    // get the unfrozen node
    return this.node(id) as MutableNode;
  }

  private node(id: NodeId, fn?: (node: Node) => void) {
    const node = this.nodeMap.get(id);
    if (!node) {
      throw new Error("Cannot mutate node that does not exist");
    }

    fn?.(node);

    return node;
  }

  dispose() {
    this.drafting = false;
  }
}

// traps the changes to the node and records them
class Transformer {
  constructor(
    private readonly changes: StateChanges,
    private readonly actions: StateActions,
  ) {}

  changeType(node: Node, type: NodeType) {
    console.log(
      p14("%c[trap]"),
      "color:green",
      "change type",
      node.id.toString(),
      node.renderVersion,
    );
    this.changes.add(NameChange.create(node.id, node.type.name, type.name));
    // this.actions.add(ChangeNameAction.withBefore(node.id, node.type.name, type.name));

    node.changeType(type);
  }

  insert(node: Node, parent: Node, index: number) {
    console.log(p14("%c[trap]"), "color:green", "insert", node.key);
    const updated = parent.insert(node, index);

    const { path } = node;
    this.changes.add(InsertChange.create(node.id, node.id, path));
    // if (index === 0) {
    //   this.actions.add(InsertNodeAction.create(nodeLocation(node)!, node.id, node.toJSON()));
    // } else {
    //   this.actions.add(InsertNodeAction.create(nodeLocation(node)!, node.id, node.toJSON()));
    // }

    this.changes.dataMap.set(node.id, node.data);
  }

  remove(node: Node, parent: Node) {
    console.log(p14("%c[trap]"), "color:green", "remove", node.key);

    const { path } = node;
    this.changes.add(RemoveChange.create(parent.id, node.id, path));
    this.changes.dataMap.set(node.id, node.data);

    parent.remove(node);
  }

  insertText(node: Node, text: string, offset: number) {
    console.log(p14("%c[trap]"), "color:green", "add text", node.key);
    this.changes.add(TextChange.create(node.id, offset, text, "insert"));
    node.insertText(text, offset);
  }

  removeText(node: Node, text: string, offset: number) {
    console.log(p14("%c[trap]"), "color:green", "add text", node.key);
    this.changes.add(
      TextChange.create(
        node.id,
        offset,
        node.textContent.slice(offset, offset + length),
        "remove",
      ),
    );

    node.removeText(offset, text.length);
  }

  addLink(node: Node, link: Node) {
    console.log(p14("%c[trap]"), "color:green", "link", node.key);
    const oldLink = node.links[link.linkName];
    if (!oldLink.eq(node)) {
      this.changes.add(LinkChange.create(node.id, oldLink?.id, node.id));
    }

    node.addLink(link.linkName, link);
  }

  removeLink(node: Node, linkName: string) {
    node.removeLink(linkName);
  }

  // update content is valid only for textContainer and text nodes
  updateContent(node: Node, content: Node[] | string) {
    console.log(
      p14("%c[trap]"),
      "color:green",
      "content",
      node.key,
      node.textContent,
    );
    const oldText = node.textContent;
    const oldChildren = node.children;
    node.updateContent(content);
    const newText = node.textContent;
    const newChildren = node.children;
    // console.log('update content', oldText, newText, oldChildren, newChildren)

    const isUpdated = oldText !== newText || oldChildren !== newChildren;
    if (!isUpdated) {
      console.warn(
        "unnecessary content update detected. possibly the node is immutable",
      );
    }

    const path = node.path;

    if (isString(content) && oldText !== newText) {
      this.changes.add(
        SetContentChange.create(node.id, path, oldText, newText),
      );
      this.actions.add(SetContentAction.withBefore(node.id, oldText, newText));
      return;
    }

    if (
      (isArray(content) && oldChildren.length !== newChildren.length) ||
      oldChildren.some((n, i) => n.id !== newChildren[i].id)
    ) {
      this.actions.add(
        SetContentAction.withBefore(
          node.id,
          oldChildren.map((n) => n.toJSON()),
          newChildren.map((n) => n.toJSON()),
        ),
      );
      this.changes.add(
        SetContentChange.create(
          node.id,
          path,
          oldChildren.map((n) => n.id),
          newChildren.map((n) => n.id),
        ),
      );
    }
  }

  updateProps(node: Node, props: NodePropsJson) {
    // return
    console.log(p14("%c[trap]"), "color:green", "update", node.key);
    const before = reduce(
      props,
      (acc, _, k) => {
        // NOTE: we are only interested in the props that are changed
        // even if it was undefined before, we need to track it as before value
        acc[k] = node.props.get(k);
        return acc;
      },
      {},
    );

    if (isEqual(before, props)) {
      console.log("same props", before, props);
      console.warn(
        "unnecessary props update detected. possibly the node is immutable",
      );
      return false;
    }

    this.actions.add(UpdatePropsAction.withBefore(node.id, before, props));
    this.changes.add(UpdateChange.create(node.id, node.path, before, props));

    console.log("UPDATING props", props);

    node.updateProps(props);

    return true;
  }
}
