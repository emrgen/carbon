import {
  ActionOrigin,
  BlockSelection,
  Draft,
  EmptyPlaceholderPath,
  FocusedPlaceholderPath,
  HasFocusPath,
  isPassiveHidden,
  MutableNode,
  Node,
  NodeId,
  NodeIdSet,
  NodePropsJson,
  NodeType,
  PlaceholderPath,
  PluginManager,
  Point,
  PointAt,
  PointedSelection,
  Schema,
  SelectedPath,
  sortNodesByDepth,
  State as CoreState,
  StateActions,
  StateScope,
  p14,
  InsertNodeAction,
  nodeLocation,
  RemoveNodeAction,
  SetContentAction,
  ChangeNameAction,
  UpdatePropsAction,
  UpdateChange, SelectAction,
} from "@emrgen/carbon-core";
import {Optional} from "@emrgen/types";
import {ImmutableState} from "./ImmutableState";
import {first, isArray, isEmpty, isEqual, isString, last, reduce} from "lodash";
import FastPriorityQueue from "fastpriorityqueue";
import {ImmutableNodeMap} from "./ImmutableNodeMap";
import {
  InsertChange,
  LinkChange,
  NameChange,
  RemoveChange,
  SelectionChange,
  SetContentChange,
  StateChanges,
  TextChange
} from "@emrgen/carbon-core/src/core/NodeChange";

enum UpdateDependent {
  None = 0,
  Prev = 1,
  Next = 2,
  Parent = 4,
}

// NOTE: it is internal to the state and actions. it should not be used outside of it.
//draft of a state is used to prepare a new state before commit
export class ImmutableDraft implements Draft {
  origin: ActionOrigin;
  pm: PluginManager;
  schema: Schema;

  state: ImmutableState;
  nodeMap: ImmutableNodeMap;
  selection: PointedSelection;

  selected: NodeIdSet = NodeIdSet.empty();

  updated: NodeIdSet; // tracks changed nodes
  contentChanged: NodeIdSet = NodeIdSet.empty(); // tracks nodes with content changes

  unstable: NodeIdSet = NodeIdSet.empty();

  changes: StateChanges = StateChanges.empty();
  actions: StateActions = StateActions.empty();
  tm: Transformer;

  private drafting = true;

  constructor(state: ImmutableState, origin: ActionOrigin, pm: PluginManager, schema: Schema) {
    this.origin = origin;
    this.state = state;
    this.pm = pm;
    this.tm = new Transformer(this.changes, this.actions);
    this.schema = schema;
    this.nodeMap = ImmutableNodeMap.from(state.nodeMap);
    this.updated = new NodeIdSet();
    this.selection = state.selection.unpin(origin);
    state.blockSelection.blocks.forEach(n => this.selected.add(n.id));
  }

  private addContentChanged(id: NodeId) {
    this.contentChanged.add(id);
    // if the node is not deleted, add it to the unstable list
    // there is no need to stabilize deleted nodes
    if (!this.nodeMap.deleted(id)) {
      this.unstable.add(id);
    }
  }

  private addUpdated(id: NodeId) {
    this.updated.add(id);
  }

  private removeUpdated(id: NodeId) {
    this.updated.remove(id);
  }

  private addInserted(node: Node) {
    const {id} = node;
    this.nodeMap.set(node.id, node);
    // this.inserted.add(id);
    // this.removed.remove(id);
  }

  private addRemoved(id: NodeId) {
    this.nodeMap.delete(id);
  }

  get(id: NodeId): Optional<Node> {
    return this.nodeMap.get(id);
  }

  parent(from: NodeId | Node): Optional<Node> {
    return this.nodeMap.parent(from);
  }

  produce(fn: (producer: ImmutableDraft) => void): CoreState {
    // const draft = new ImmutableDraft(this, origin);
    const {scope} = this.state;
    try {
      console.log('[SCOPE]', scope.toString())
      StateScope.put(scope, this.nodeMap);
      StateScope.set(scope);

      fn(this);
      const state = this.commit(3);
      StateScope.put(scope, state.nodeMap)

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
  commit(depth: number): ImmutableState {
    this.prepare();

    const {state, updated, selection} = this;

    const nodeMap = this.nodeMap.current.size === 0 ? state.nodeMap : this.nodeMap;
    // as the root node is always same id, we can get the root node by id
    const content = this.nodeMap.get(this.state.content.id);

    if (!content) {
      throw new Error("Cannot commit draft with invalid content");
    }

    // create a new selection based on the new node map using the draft selection
    const after = selection.pin();
    if (!after) {
      throw new Error("Cannot commit draft with invalid pinned selection");
    }

    updated.freeze();
    nodeMap.contracts(2)
    nodeMap.freeze();
    after.freeze();

    const selected = this.selected.nodes(this.nodeMap)
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
    this.unstable.toArray().forEach(id => {
      if (this.nodeMap.deleted(id)) {
        this.unstable.remove(id)
      }
    })

    this.normalize();

    // remove deleted nodes from changed list
    // this will prevent from trying to render deleted nodes
    this.updated.toArray().forEach(id => {
      // console.log('checking deleted', id.toString(), this.nodeMap.deleted(id));
      if (this.nodeMap.deleted(id)) {
        this.removeUpdated(id);
        return
      }

      // remove the hidden nodes
      this.node(id, (node) => {
        if (isPassiveHidden(node) || node.isCollapseHidden) {
          console.debug('removing hidden node', node.name, node.id.toString());
          this.removeUpdated(id);
        }
      })
    });

    const dirty = this.updated.clone();
    this.updated.nodes(this.nodeMap).forEach(node => {
      node.parents.forEach(parent => {
        dirty.add(parent.id);
      })
    })

    dirty.nodes(this.nodeMap).forEach(node => {
      node.renderVersion += 1;
    });

    this.contentChanged.nodes(this.nodeMap).forEach(node => {
      node.parents.forEach(parent => {
        this.contentChanged.add(parent.id);
      })
    });

    this.contentChanged.nodes(this.nodeMap).forEach(node => {
      node.contentVersion += 1;
    });

    return this;
  }

  // WARNING: inefficient implementation for validation of ideas only
  private normalize() {
    // console.debug('unstable nodes', this.unstable.toArray().map(n => n.toString()).join(', '))
    const unstable = this.unstable.nodes(this.nodeMap);
    const nodes = sortNodesByDepth(unstable).reverse();
    const node = first(nodes);
    if (!node) {
      console.warn('no unstable node not found')
      return
    }

    const actions = this.pm.normalize(node);
    if (!isEmpty(actions)) {
      console.debug('normalizing', node.name, node.id.toString(), actions)
      actions.forEach(action => {
        action.execute(this)
      })

      console.log(actions, actions.map(a => a.toString()), 'actions normalized')
    }

    this.unstable.remove(node.id);
    if (this.unstable.size > 0) {
      this.normalize();
      return;
    }

    this.normalizeSchema()
  }

  // normalize unstable nodes by inserting missing nodes as per the schema
  private normalizeSchema() {
    console.debug('normalizing schema');
    const nodes = this.unstable.nodes(this.nodeMap).forEach(node => {

    })
  }

  updateContent(nodeId: NodeId, content: Node[] | string) {
    if (!this.drafting) {
      throw new Error("Cannot update content on a draft that is already committed");
    }

    const node = this.unfreeze(nodeId);
    node.descendants().forEach(n => this.addRemoved(n.id));

    // update state
    this.tm.updateContent(node, content);

    if (isArray(content)) {
      node.descendants().forEach(n => this.addInserted(n));
    }

    console.log(content, node.textContent, node.renderVersion)

    this.addUpdated(nodeId);
    this.addContentChanged(nodeId);

    if (node.isTextContainer && isArray(content)) {
      node.updateProps({
        [PlaceholderPath]: content.length === 0 ? this.nodeMap.parent(node)?.props.get<string>(EmptyPlaceholderPath) ?? "" : ""
      });
    }
  }

  move(to: Point, nodeId: NodeId) {
    if (!this.drafting) {
      throw new Error("Cannot move node to a draft that is already committed");
    }

    const node = this.unfreeze(nodeId);
    const {parent} = node;
    if (!parent) {
      throw new Error("Cannot move node that does not have a parent");
    }

    this.updateDependents(node, UpdateDependent.Next);

    this.tm.remove(node, parent);
    node.setParentId(null);

    this.addUpdated(parent.id);
    this.addContentChanged(parent.id);

    this.insert(to, node, "move");
  }

  insertText(at: Point, text: string) {
    const {nodeId, offset} = at;
    const node = this.nodeMap.get(nodeId);
    if (!node) {
      throw new Error("Cannot insert text to a node that does not exist");
    }

    if (node.isTextContainer) {
      if (node.isEmpty) {
        // insert a empty text node with the text
        const textNode = node.type.schema.text(text)!;
        this.updateContent(node.id, [textNode]);
      } else {
        const {textContent} = node;
        // FIXME: find the correct child with offset
        const newText = textContent.slice(0, offset) + text + textContent.slice(offset);
        const textNode = node.firstChild!;
        this.updateContent(textNode.id, newText);
      }
    }


  }

  insert(at: Point, node: Node, type: "create" | "move" = "create") {
    if (!this.drafting) {
      throw new Error("Cannot insert node to a draft that is already committed");
    }

    // mark moved/inserted nodes as inserted ones
    // these will not be rendered explicitly
    node.all(n => this.addInserted(n));

    if (type === "create") {
      // set empty placeholder of inserted node if needed
      if (node.isEmpty) {
        const placeholder = node.props.get<string>(EmptyPlaceholderPath) ?? "";
        // console.debug('empty placeholder', placeholder, node.id.toString())
        node.firstChild?.updateProps({
          [PlaceholderPath]: placeholder
        });
      }
    }

    console.debug('inserting new item')
    switch (at.at) {
      case PointAt.After:
        return this.insertAfter(at.nodeId, node);
      case PointAt.Before:
        return this.insertBefore(at.nodeId, node);
      case PointAt.Start:
        return this.prepend(at.nodeId, node);
      case PointAt.End:
        return this.append(at.nodeId, node);
    }

    throw new Error("Invalid insertion point");
  }

  private prepend(parentId: NodeId, node: Node) {
    const parent = this.unfreeze(parentId);
    this.tm.insert(node, parent, 0);
    this.addUpdated(parent.id);
    this.addContentChanged(parent.id);

    // this.mutable(parentId, parent => {
    //   parent.children.forEach(ch => this.mutable(ch.id));
    //   parent.insert(node, 0);
    //   this.contentChanged.add(parent.id);
    //   this.unstable.add(parent.id);
    // });
  }

  private append(parentId: NodeId, node: Node) {
    const parent = this.unfreeze(parentId);
    this.tm.insert(node, parent, parent.size);
    this.addUpdated(parent.id);
    this.addContentChanged(parent.id);
    // this.mutable(parentId, parent => {
    //   parent.insert(node, parent.size);
    //   this.contentChanged.add(parent.id);
    //   this.unstable.add(parent.id);
    // });
  }

  private insertBefore(refId: NodeId, node: Node) {
    const refNode = this.nodeMap.get(refId);
    if (!refNode) {
      throw new Error("Cannot insert node before a node that does not exist");
    }

    const parentId = refNode.parentId;
    if (!parentId) {
      throw new Error("Cannot insert node before a node that does not have a parent");
    }

    const parent = this.unfreeze(parentId);
    this.tm.insert(node, parent, refNode.index);
    this.addUpdated(parent.id);
    this.addContentChanged(parent.id);
  }

  private insertAfter(refId: NodeId, node: Node) {
    const refNode = this.nodeMap.get(refId);
    if (!refNode) {
      throw new Error("Cannot insert node before a node that does not exist");
    }

    const parentId = refNode.parentId;
    if (!parentId) {
      throw new Error("Cannot insert node before a node that does not have a parent");
    }

    const parent = this.unfreeze(parentId);
    this.tm.insert(node, parent, refNode.index + 1);
    this.addUpdated(parent.id);
    this.addContentChanged(parent.id);
  }

  remove(nodeId: NodeId) {
    if (!this.drafting) {
      throw new Error("Cannot remove node from a draft that is already committed");
    }

    const node = this.unfreeze(nodeId);
    const parentId = node.parentId;
    if (!parentId) {
      throw new Error("Cannot remove node that does not have a parent");
    }

    const {parent} = node;
    if (!parent) {
      throw new Error("Cannot remove node that does not have a parent");
    }

    this.tm.remove(node, parent);

    this.addRemoved(node.id);
    this.addUpdated(parent.id);
    this.addContentChanged(parent.id);
    node.all(n => this.addRemoved(n.id));

    // if parent title is empty, set placeholder from parent
    if (parent.isTextContainer && parent.isEmpty) {
      const placeholder = parent.parent?.props.get<string>(EmptyPlaceholderPath) ?? "";
      this.tm.updateProps(parent, {
        [PlaceholderPath]: placeholder
      });
    }
  }

  change(nodeId: NodeId, type: NodeType) {
    if (!this.drafting) {
      throw new Error("Cannot change name on a draft that is already committed");
    }

    const node = this.unfreeze(nodeId);
    this.updateDependents(node, UpdateDependent.Next);
    this.tm.changeType(node, type);

    if (node.isContainer && node.firstChild?.isEmpty) {
      const firstChild = this.unfreeze(node.firstChild.id);
      firstChild.updateProps({
        [PlaceholderPath]: type.props.get<string>(EmptyPlaceholderPath) ?? ""
      });
    }

    this.addUpdated(node.id);
  }

  updateProps(nodeId: NodeId, props: Partial<NodePropsJson>) {
    if (!this.drafting) {
      throw new Error("Cannot change name on a draft that is already committed");
    }

    if (this.nodeMap.deleted(nodeId)) {
      console.debug('node is deleted', nodeId.toString())
      this.selected.remove(nodeId);
      return;
    }

    const node = this.unfreeze(nodeId);
    this.tm.updateProps(node, props);
    this.addUpdated(node.id);

    if (props[SelectedPath] === true) {
      this.selected.add(nodeId);
    }

    if (props[SelectedPath] === false) {
      this.selected.remove(nodeId);
    }
  }

  updateSelection(selection: PointedSelection) {
    if (!this.drafting) {
      throw new Error("Cannot update selection on a draft that is already committed");
    }

    // console.log("update selection", selection.isInline);
    this.selection = selection;

    const before = this.state.selection.unpin()
    this.changes.add(SelectionChange.create(before, selection));
    this.actions.add(SelectAction.create(before, selection));

    // update empty placeholder of the previous head node
    if (this.state.selection.isCollapsed) {
      if (!this.state.selection.isInvalid) {
        const {head} = this.state.selection.unpin();
        if (!this.nodeMap.deleted(head.nodeId)) {
          const node = this.unfreeze(head.nodeId);
          if (!node) {
            throw new Error("Cannot update selection on a draft that is already committed");
          }

          if (node.isEmpty) {
            const {parent} = node;
            if (!parent) return
            this.tm.updateProps(node, {
              [PlaceholderPath]: parent.props.get<string>(EmptyPlaceholderPath) ?? " ",
            });
            console.log('updated empty placeholder', node.key, parent.props.get<string>(EmptyPlaceholderPath), parent.name)
            this.addUpdated(node.id);
          }
        }
      }
    }

    // update focus placeholder of the current head node
    if (selection.isCollapsed && !selection.isInvalid) {
      const {head: headPin} = this.state.selection;
      const {head} = selection;
      if (this.nodeMap.deleted(head.nodeId)) return;

      const node = this.unfreeze(head.nodeId);
      if (!node) {
        throw new Error("Cannot update selection on a draft that is already committed");
      }

      if (node.isEmpty) {
        const {parent} = node;
        if (!parent) return;
        this.tm.updateProps(node, {
          [PlaceholderPath]: parent.props.get<string>(FocusedPlaceholderPath) ?? "",
        })
        this.addUpdated(node.id);
      }
    }

    // update focus marker if needed
    if (this.state.selection.tail.node.id.eq(this.selection.tail.nodeId)) {
      return
    }

    if (!this.state.selection.isInvalid) {
      const {tail} = this.state.selection.unpin();
      if (!this.nodeMap.deleted(tail.nodeId)) {
        const node = this.unfreeze(tail.nodeId);
        if (this.nodeMap.deleted(node.id)) return;
        this.tm.updateProps(node, {
          [HasFocusPath]: '',
        });
        this.addUpdated(node.id)
      }
    }

    // console.log('Selection', this.selection.head.eq(Point.IDENTITY))
    if (!this.selection.isInvalid) {
      const node = this.unfreeze(this.selection.tail.nodeId);
      this.tm.updateProps(node, {
        [HasFocusPath]: true,
      })
      this.addUpdated(node.id);
    }
  }

  private updateBlockSelection(selection: PointedSelection) {
    // if (browser)
    // const old = NodeIdSet.fromIds(this.state.selection.nodes.map(n => n.id));
    // const after = selection.pin()!;
    // if (after) {
    //   const nids = after.blocks.map(n => n.id);
    //   const now = NodeIdSet.fromIds(nids);
    //   console.log(nids, after.nodes, after.head.node, after.tail.node)
    //
    //   this.selection = PointedSelection.create(selection.tail, selection.head, selection.origin);
    //
    //   // find removed block selection
    //   old.diff(now).forEach(id => {
    //     this.mutable(id, node => {
    //       node.updateProps({
    //         [SelectedPath]: false
    //       });
    //     });
    //   })
    //
    //   // find new block selection
    //   now.diff(old).forEach(id => {
    //     this.mutable(id, node => {
    //       console.log('selected node', node.name, node.id.toString());
    //       node.updateProps({
    //         [SelectedPath]: true
    //       });
    //     });
    //   })
    // }
  }

  // check and update render dependents
  private updateDependents(node: Node, flag: number) {
    if (flag & UpdateDependent.Parent && node.parent?.type.spec.depends?.child) {
      const parentId = node.parent?.id;
      if (!parentId) return
      const parent = this.unfreeze(parentId);
      this.addUpdated(parent.id);
      this.updateDependents(parent, UpdateDependent.Parent);
    }

    // console.log('update prev', flag, node.id.toString(), node.prevSibling?.type.spec.depends?.prev)
    if (flag & UpdateDependent.Prev && node.prevSibling?.type.spec.depends?.next) {
      const prevId = node.prevSibling?.id;
      if (!prevId) return
      const prev = this.unfreeze(prevId);
      this.addUpdated(prev.id);
      this.updateDependents(prev, UpdateDependent.Prev);
    }


    // console.log('update next', flag, node.id.toString(), node.nextSibling?.type.spec.depends?.prev)
    if (flag & UpdateDependent.Next && node.nextSibling?.type.spec.depends?.prev) {
      const nextId = node.nextSibling?.id;
      if (!nextId) return
      const next = this.unfreeze(nextId);
      this.addUpdated(next.id);
      this.updateDependents(next, UpdateDependent.Next);
    }
  }

  private unfreeze(id: NodeId): MutableNode {
    const node = this.node(id);
    const root = this.nodeMap.get(NodeId.ROOT);
    if (!root) {
      throw new Error("Cannot mutate node that does not exist");
    }

    const {path} = node;
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

  private put(id: NodeId, node: Node) {
    this.nodeMap.set(id, node);
  }

  dispose() {
    this.drafting = false;
  }

}

interface NodeDepthEntry {
  node: Node;
  depth: number;
}


// traps the changes to the node and records them into the draft
class Transformer {
  constructor(private readonly changes: StateChanges, private readonly actions: StateActions) {
  }

  changeType(node: Node, type: NodeType) {
    console.log(p14('%c[trap]'), "color:green", 'change type', node.id.toString(), node.renderVersion);
    this.changes.add(NameChange.create(node.id, node.type.name, type.name));
    this.actions.add(ChangeNameAction.withBefore(node.id, node.type.name, type.name));

    node.changeType(type);
  }

  insert(node: Node, parent: Node, index: number) {
    console.log(p14('%c[trap]'), "color:green", 'insert', node.key);
    const updated = parent.insert(node, index);

    const {path} = node;
    this.changes.add(InsertChange.create(node.id, node.id, path));
    if (index === 0) {
      this.actions.add(InsertNodeAction.create(nodeLocation(node)!, node.id, node.toJSON()));
    } else {
      this.actions.add(InsertNodeAction.create(nodeLocation(node)!, node.id, node.toJSON()));
    }

    this.changes.dataMap.set(node.id, node.data);
  }

  remove(node: Node, parent: Node) {
    console.log(p14('%c[trap]'), "color:green", 'remove', node.key)

    const {path} = node;
    this.changes.add(RemoveChange.create(parent.id, node.id, path));
    this.changes.dataMap.set(node.id, node.data);
    this.actions.add(RemoveNodeAction.create(nodeLocation(node)!, node.id, node.toJSON()));

    parent.remove(node);
  }

  insertText(node: Node, text: string, offset: number) {
    console.log(p14('%c[trap]'), "color:green", 'add text', node.key)
    this.changes.add(TextChange.create(node.id, offset, text, 'insert'));
    const before = node.textContent

    node.insertText(text, offset)

    const after = node.textContent
    this.actions.add(SetContentAction.withBefore(node.id, before, after));
  }

  removeText(node: Node, text: string, offset: number) {
    console.log(p14('%c[trap]'), "color:green", 'add text', node.key);
    this.changes.add(TextChange.create(node.id, offset, node.textContent.slice(offset, offset + length), 'remove'));

    node.removeText(offset, text.length);
  }

  addLink(node: Node, link: Node) {
    console.log(p14('%c[trap]'), "color:green", 'link', node.key)
    const oldLink = node.links[link.linkName]
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
    console.log(p14('%c[trap]'), "color:green", 'content', node.key, node.textContent);
    const oldText = node.textContent;
    const oldChildren = node.children;
    node.updateContent(content)
    const newText = node.textContent;
    const newChildren = node.children;
    // console.log('update content', oldText, newText, oldChildren, newChildren)

    const isUpdated = oldText !== newText || oldChildren !== newChildren;
    if (!isUpdated) {
      console.warn("unnecessary content update detected. possibly the node is immutable")
    }

    const path = node.path;

    if (isString(content) && oldText !== newText) {
      this.changes.add(SetContentChange.create(node.id, path, oldText, newText));
      this.actions.add(SetContentAction.withBefore(node.id, oldText, newText));
      return
    }

    if (isArray(content) && oldChildren.length !== newChildren.length || oldChildren.some((n, i) => n.id !== newChildren[i].id)) {
      this.actions.add(SetContentAction.withBefore(node.id, oldChildren.map(n => n.toJSON()), newChildren.map(n => n.toJSON())));
      this.changes.add(SetContentChange.create(node.id, path, oldChildren.map(n => n.id), newChildren.map(n => n.id)))
      oldChildren.forEach(n => this.changes.dataMap.set(n.id, n.data));
      newChildren.forEach(n => this.changes.dataMap.set(n.id, n.data));
    }
  }

  updateProps(node: Node, props: NodePropsJson) {
    console.log(p14('%c[trap]'), "color:green", 'update', node.key);
    const before = reduce(props, (acc, _, k) => {
      const v = node.props.get(k);
      if (v) {
        acc[k] = v;
      }

      return acc;
    },{});

    if (isEqual(before, props)) {
      console.warn("unnecessary props update detected. possibly the node is immutable")
      return
    }

    this.actions.add(UpdatePropsAction.withBefore(node.id, before, props));
    this.changes.add(UpdateChange.create(node.id, node.path, before, props));

    node.updateProps(props);
  }
}

// NOTE: this is a priority queue that sorts nodes by depth
class NodeDepthPriorityQueue {
  private queue: FastPriorityQueue<NodeDepthEntry>;

  static from(nodes: Node[], order: "asc" | "desc" = "desc") {
    const comparator = order === "asc" ? NodeDepthComparator : (a: NodeDepthEntry, b: NodeDepthEntry) => NodeDepthComparator(b, a);
    const queue = new NodeDepthPriorityQueue(comparator);
    nodes.forEach(n => {
      const depth = n.parents.length;
      queue.add(n, depth);
    });
    return queue;
  }

  constructor(comparator: ((a: NodeDepthEntry, b: NodeDepthEntry) => boolean)) {
    this.queue = new FastPriorityQueue(comparator);
  }

  add(node: Node, depth: number) {
    this.queue.add({node, depth});
  }

  pop() {
    return this.queue.poll();
  }

  isEmpty() {
    return this.queue.isEmpty();
  }

  get size() {
    return this.queue.size;
  }
}

const NodeDepthComparator = (a: NodeDepthEntry, b: NodeDepthEntry) => {
  if (!a.node.parentId) {
    return true;
  }

  if (!b.node.parentId) {
    return false;
  }

  if (a.depth === b.depth) {
    if (a.node.parentId === b.node.parentId) {
      return a.node.id.comp(b.node.id) < 0;
    } else if (a.node.parentId && b.node.parentId) {
      return a.node.parentId.comp(b.node.parentId) < 0;
    } else {
      return false;
    }
  }

  return a.depth < b.depth;
};
