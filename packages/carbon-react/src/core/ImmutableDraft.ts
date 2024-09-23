import {
  ActionOrigin,
  BlockSelection,
  ChangeNameAction,
  cloneFrozenNode,
  deepCloneMap,
  Draft,
  EmptyPlaceholderPath,
  FocusedPlaceholderPath,
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
  UnstablePath,
  UpdateChange,
  UpdatePropsAction,
} from "@emrgen/carbon-core";
import { HasFocusPath } from "@emrgen/carbon-core";
import { Optional } from "@emrgen/types";
import { ImmutableState } from "./ImmutableState";
import {
  first,
  flatten,
  identity,
  isArray,
  isEmpty,
  isEqual,
  isString,
  reduce,
} from "lodash";
import { ImmutableNodeMap } from "./ImmutableNodeMap";
import { InlineNode } from "@emrgen/carbon-core/src/core/InlineNode";

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

  // private decorations: NodeIdMap = new NodeIdMap();

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
    // if the node is not deleted, we need to update the view and stabilize the node
    // there is no need to update or stabilize deleted nodes
    if (this.nodeMap.isDeleted(id)) {
      return;
    }
    // console.log("UNSTABLE", id.toString());
    this.contentChanged.add(id);
    this.unstable.add(id);
  }

  private addUpdated(id: NodeId) {
    this.updated.add(id);
  }

  private removeUpdated(id: NodeId) {
    this.updated.remove(id);
  }

  private addInserted(node: Node) {
    // console.log("ADD INSERTED", node.id.toString());
    this.nodeMap.set(node.id, node);
  }

  private addRemoved(node: Node) {
    // console.log("ADD REMOVED", node.id.toString());
    const { parentId, id } = node;
    // remove the node from the map if the parent of the node matches with the parent id in the map node
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
    const oldScope = StateScope.current();
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
      console.log("rejected commit");
      return this.state;
    } finally {
      StateScope.set(oldScope);
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
    // nodeMap.contracts(2);
    // nodeMap.freeze();
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

    // traverse all nodes within the selection and collect decorations
    const { start, end } = after;
    const startDown = start.down();
    const endDown = end.down();
    const nodes: Node[] = [startDown.node, endDown.node];
    startDown.node.next((n) => {
      if (n.id.eq(endDown.node.id)) return true;
      nodes.push(n);
      return false;
    });

    // collect decorations from the selected nodes
    // const decorations: NodeIdMap<PlainNodeProps> = new NodeIdMap();
    // nodes.forEach((n) => {
    //   const props = this.pm.decoration(n);
    //   decorations.set(n.id, props);
    // });

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
        console.log("REMOVING DELETED NODE", id.toString());
        this.unstable.remove(id);
      }
    });

    // move the select action to the end of the actions
    // this will ensure that the selection is updated after all the changes
    if (this.actions.last() instanceof SelectAction) {
      const selectAction = this.actions.pop() as SelectAction;
      this.normalize();
      this.actions.add(selectAction);
    } else {
      this.normalize();
    }
    this.updateSelectionProps();

    if (!this.state.selection.unpin().eq(this.selection)) {
      // this.collectMarks();
    }

    // remove deleted nodes from changed list
    // this will prevent from trying to render deleted nodes
    this.updated.toArray().forEach((id) => {
      // console.log('checking deleted', id.toString(), this.nodeMap.deleted(id));
      if (this.nodeMap.isDeleted(id)) {
        // console.log("REMOVED", id.toString());
        this.removeUpdated(id);
        return;
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
      // console.warn("no unstable node not found");
      return;
    }

    const actions = this.pm.normalize(node.clone(deepCloneMap));
    if (!isEmpty(actions)) {
      console.log("normalizing", node.name, node.id.toString(), actions);
      actions.forEach((action) => {
        action.execute(this);
      });
    }

    this.unstable.remove(node.id);
    if (this.unstable.size > 0) {
      this.normalize();
      return;
    }

    this.normalizeSchema();
  }

  // TODO: normalize unstable nodes by inserting missing nodes as per the schema
  // we keep the schema consistent by inserting missing nodes
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
    console.debug("update content", nodeId.toString(), content);
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

    node.descendants().forEach((n) => this.addRemoved(n));
    // update state
    this.tm.updateContent(node, content);
    if (isArray(content)) {
      node.descendants().forEach((n) => this.addInserted(n));
    }

    // console.log(content, node.textContent, node.renderVersion);

    this.addUpdated(nodeId);

    // for text container update empty placeholder
    if (node.isTextContainer && isArray(content)) {
      this.tm.updateProps(node, {
        [PlaceholderPath]:
          content.length === 0
            ? (this.nodeMap
                .parent(node)
                ?.props.get<string>(EmptyPlaceholderPath) ?? "")
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
            ? (this.nodeMap
                .parent(parent)
                ?.props.get<string>(EmptyPlaceholderPath) ?? "")
            : " ",
      });
      // if (updated) {
      this.addUpdated(parent.id);
      this.addContentChanged(parent.id);
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
          this.addRemoved(n);
        }
      });
      newChildren.forEach((n) => {
        this.addInserted(n);
      });
      this.addUpdated(nodeId);
      this.addContentChanged(nodeId);
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
        // console.log(
        //   "INSERTING TEXT",
        //   text,
        //   offset,
        //   node.textContent,
        //   marks.toString(),
        // );

        // find text node and insert text at the offset
        // if the marks match with the text node, insert the text only
        // otherwise split the text node and insert the text with the marks

        const pin = Pin.fromPoint(at, this.nodeMap);
        if (!pin) {
          throw new Error("Cannot insert text to a node that does not exist");
        }
        const down = pin?.down();
        if (!down) {
          throw new Error("Cannot insert text to a node that does not exist");
        }

        const { node: downNode } = down;

        console.log(
          "CURRENT NODE",
          down.node.name,
          down.node.textContent,
          down.node.props.get(MarksPath, []),
        );
        const insertTextNode = node.type.schema.text(text, {
          props: {
            [MarksPath]: marks.toArray(),
          },
        })!;

        if (offset === 0) {
          this.updateContent(
            pin?.node.id!,
            [
              ...downNode.prevSiblings,
              insertTextNode,
              downNode,
              ...downNode.nextSiblings,
            ]
              .filter(identity)
              .map(cloneFrozenNode),
          );
        } else if (offset === downNode.focusSize) {
          this.updateContent(
            pin?.node.id!,
            [
              ...downNode.prevSiblings,
              downNode,
              insertTextNode,
              ...downNode.nextSiblings,
            ]
              .filter(identity)
              .map(cloneFrozenNode),
          );
        } else {
          const [left, right] = InlineNode.from(downNode).split(down.offset);
          const nodes = flatten(
            pin?.node.children.map((n) => {
              if (n.id.eq(downNode.id)) {
                return [left, insertTextNode, right].filter(identity);
              }

              return n;
            }),
          ).map(cloneFrozenNode);

          this.updateContent(pin?.node.id!, nodes);
        }
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
      node.all((n) => this.addRemoved(n));
      return;
    }

    //
    if (type === "create") {
      this.actions.add(InsertNodeAction.create(at, node.id, node.toJSON()));
    }

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

    // mark moved/inserted nodes as inserted ones
    // these will not be rendered explicitly
    node.all((n) => {
      console.log("INSERTED", n.id.toString(), n.parentId?.toString());
      this.addInserted(n);
    });
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
    node.all((n) => this.addRemoved(n));

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

    if (props[MarksPath] && node.isInline) {
      this.addContentChanged(node.parentId!);
    }

    if (props[SelectedPath] === true) {
      this.selected.add(nodeId);
    }

    if (props[SelectedPath] !== true) {
      this.selected.remove(nodeId);
    }

    if (props[UnstablePath]) {
      this.unstable.add(nodeId);
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
    const prevSelection = this.state.selection;

    // update empty placeholder of the previous head node
    if (!prevSelection.isInvalid && prevSelection.isCollapsed) {
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

    // update focus placeholder of the current head node
    if (!this.selection.isInvalid && this.selection.isCollapsed) {
      const { head } = this.selection;
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

    const selection = this.selection.pin(this.nodeMap);
    // update focus marker if needed
    const downHead = this.state.selection.tail.down()?.node;
    if (downHead && selection?.head.node.eq(downHead)) {
      return;
    }

    if (!prevSelection.isInvalid) {
      const head = prevSelection.head.down();
      if (head) {
        const headId = head.node.id;
        if (!this.nodeMap.isDeleted(headId)) {
          const node = this.unfreeze(headId);
          if (this.nodeMap.isDeleted(node.id)) return;
          node.updateProps({
            [HasFocusPath]: "",
          });

          this.addUpdated(node.id);
        }
      }
    }

    // console.log('Selection', this.selection.head.eq(Point.IDENTITY))
    if (!this.selection.isInvalid) {
      if (selection) {
        const head = selection.head.down();
        if (head) {
          const headId = head.node.id;
          const node = this.unfreeze(headId);
          node.updateProps({
            [HasFocusPath]: true,
          });

          this.addUpdated(node.id);
        }
      }
    }
  }

  private updateFocusMarker() {}

  private collectMarks() {
    const { selection } = this;
    const pinnedSelection = selection.pin(this.nodeMap);
    if (!pinnedSelection) {
      console.error("pinned selection is invalid", selection.toString());
      return;
    }

    // collect marks from the selection
    const { start, end } = pinnedSelection;
    if (selection.isCollapsed) {
      let downPin = start.down();
      if (downPin?.offset === 0 && downPin?.node.prevSiblings.length === 0) {
        this.marks = MarkSet.empty();
      } else {
        downPin = downPin.leftAlign;
        // console.info("down pin", downPin.toString());
        // console.info(downPin.node.props.get(MarksPath, []));
        const marks = downPin.node.marks;
        this.marks = MarkSet.from(marks);
      }
    } else {
      const startDown = start.down().rightAlign;
      const endDown = end.down().leftAlign;
      const nodes: Node[] = [startDown.node, endDown.node];
      startDown.node.next((n) => {
        if (!n.isInline) {
          return false;
        }
        if (n.id.eq(endDown.node.id)) return true;
        nodes.push(n);
        return false;
      });

      const marks: Record<string, number> = {};
      nodes.forEach((n) => {
        n.marks.forEach((m) => {
          marks[m.name] = (marks[m.name] ?? 0) + 1;
        });
      });
      // TODO: collect marks that exists in all nodes
    }
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

// traps the changes to the node and records them for the commit
class Transformer {
  constructor(
    private readonly changes: StateChanges,
    private readonly actions: StateActions,
  ) {}

  changeType(node: Node, type: NodeType) {
    // console.log(
    //   p14("%c[trap]"),
    //   "color:green",
    //   "change type",
    //   node.id.toString(),
    //   node.renderVersion,
    // );
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
      isArray(content) &&
      (oldChildren.length !== newChildren.length ||
        oldChildren.some((n, i) => !InlineNode.isSimilar(n, newChildren[i])))
    ) {
      // collect set content action
      const oldContent = oldChildren.map((n) => n.toJSON());
      const newContent = newChildren.map((n) => n.toJSON());
      this.actions.add(
        SetContentAction.withBefore(node.id, oldContent, newContent),
      );

      // collect set content change
      this.changes.add(
        SetContentChange.create(
          node.id,
          path,
          oldChildren.map((n) => n.id),
          newChildren.map((n) => n.id),
        ),
      );
      this.changes.dataMap.set(node.id, node.data);
    }
  }

  updateProps(node: Node, props: NodePropsJson) {
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

    // console.log("UPDATING props", props, before);

    node.updateProps(props);

    return true;
  }
}
