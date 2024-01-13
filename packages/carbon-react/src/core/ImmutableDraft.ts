import {
  ActionOrigin,
  BlockSelection, Draft,
  Draft as CoreDraft,
  EmptyPlaceholderPath,
  FocusedPlaceholderPath,
  HasFocusPath,
  isPassiveHidden, MutableNode,
  Node,
  NodeContentData,
  NodeId,
  NodeIdSet,
  NodePropsJson,
  NodeType,
  PlaceholderPath, PluginManager,
  Point,
  PointAt,
  PointedSelection, Schema,
  SelectedPath, sortNodes, sortNodesByDepth,
  State as CoreState,
  StateScope,
} from "@emrgen/carbon-core";
import {Optional} from "@emrgen/types";
import {ImmutableState} from "./ImmutableState";
import {first, identity, isArray, isEmpty} from "lodash";
import FastPriorityQueue from "fastpriorityqueue";
import {ImmutableNodeMap} from "./ImmutableNodeMap";
import {ImmutableNode} from "./ImmutableNode";
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
import {p12, p14} from "@emrgen/carbon-core/src/core/Logger";
import {SelectionEvent} from "@emrgen/carbon-core/src/core/SelectionEvent";

enum UpdateDependent {
  None = 0,
  Prev = 1,
  Next = 2,
  Parent = 4,
}

// NOTE: it is internal to the state and actions. it should not be used outside of it.
//draft of a state is used to prepare a new state before commit
export class ImmutableDraft implements CoreDraft {
  origin: ActionOrigin;
  pm: PluginManager;
  schema: Schema;

  state: ImmutableState;
  nodeMap: ImmutableNodeMap;
  selection: PointedSelection;
  updated: NodeIdSet; // tracks changed nodes
  contentChanges: NodeIdSet = NodeIdSet.empty(); // tracks nodes with content changes
  removed: NodeIdSet = NodeIdSet.empty(); // tracks removed nodes
  inserted: NodeIdSet = NodeIdSet.empty();
  selected: NodeIdSet = NodeIdSet.empty();
  unstable: NodeIdSet = NodeIdSet.empty();

  changes: StateChanges = StateChanges.empty();
  tm: Transformer;

  private drafting = true;

  constructor(state: ImmutableState, origin: ActionOrigin, pm: PluginManager, schema: Schema) {
    this.origin = origin;
    this.state = state;
    this.pm = pm;
    this.tm = new Transformer(this.changes);
    this.schema = schema;
    this.nodeMap = ImmutableNodeMap.from(state.nodeMap);
    this.updated = new NodeIdSet();
    this.selection = state.selection.unpin(origin);
    state.blockSelection.blocks.forEach(n => this.selected.add(n.id));
  }

  addUpdated(id: NodeId) {
    this.updated.add(id);
  }

  removeUpdated(id: NodeId) {
    this.updated.remove(id);
  }

  addInserted(id: NodeId) {
    this.nodeMap.set(id, this.nodeMap.get(id)!);
    this.inserted.add(id);
    this.removed.remove(id);
  }

  addRemoved(id: NodeId) {
    this.nodeMap.delete(id);
    this.removed.add(id);
    this.inserted.remove(id);
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
      // normalize the changes before commit
      this.normalize();

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

    const { state, updated, selection } = this;

    const nodeMap = this.nodeMap.current.size === 0 ? state.nodeMap : this.nodeMap;
    // as the root node is always same id, we can get the root node by id
    const content = this.nodeMap.get(this.state.content.id);

    // console.log('commit', content?.textContent)

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
    // nodeMap.freeze();
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
      changes: this.changes,
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

    const {scope} = this.state;
    console.log('####', this.updated.toArray().map(n => n.toString()).join(', '))

    // remove deleted nodes from changed list
    // this will prevent from trying to render deleted nodes
    this.updated.toArray().forEach(id => {
      // console.log('checking deleted', id.toString(), this.nodeMap.deleted(id));
      if (this.nodeMap.deleted(id)) {
        this.removeUpdated(id);
      }
      // console.log('check if node is hidden', id.toString())
      // remove the hidden nodes
      this.node(id, (node) => {
        // console.log('changed node id', id.toString(), isPassiveHidden(node))
        if (isPassiveHidden(node) || node.isCollapseHidden) {
          console.debug('removing hidden node', node.name, node.id.toString());
          this.removeUpdated(id);
        }
      })
    });

    this.contentChanges.nodes(this.nodeMap).forEach(node => {
      node.parents.forEach(parent => {
        this.contentChanges.add(parent.id);
      })
    });

    console.log('@@@@', this.updated.toArray().map(n => n.toString()).join(', '))
    this.updated.nodes(this.nodeMap).forEach(node => {
      node.renderVersion += 1;
      console.log('updated node', node.name, node.id.toString(), node.renderVersion, node.contentVersion)
    });

    this.contentChanges.nodes(this.nodeMap).forEach(node => {
      node.contentVersion += 1;
      if (!this.updated.has(node.id)) {
        node.renderVersion += 1;
      }

      console.log('updated content', node.name, node.id.toString(), node.renderVersion, node.contentVersion)
    });

    return

    const updated: Node[] = this.updated.toArray().map(id => this.nodeMap.get(id)).map(identity) as unknown as Node[];
    const queue = NodeDepthPriorityQueue.from(updated, "desc");
    const updateOrder = NodeDepthPriorityQueue.from(updated, "desc");

    // console.log('updated nodes',updated.map(n => `${n.name}: ${n.id.toString()}`));

    const visited = NodeIdSet.fromIds(updated.map(n => n.id));
    // all nodes that are changed will be processed
    while (queue.size) {
      const { node, depth } = queue.pop()!;
      // console.log('processing node', node.name, node.id.toString(), depth);
      const parent = this.nodeMap.parent(node);
      // console.log('found parent', node.id.toString(), parent?.id.toString())
      if (parent) {
        queue.add(parent, depth - 1);
        if (visited.has(parent.id)) {
          continue;
        }
        visited.add(parent.id);
        updateOrder.add(parent, depth - 1);
      }
    }

    // console.debug('content changes', this.contentChanges.size, this.contentChanges.map(n => n.toString()).join(', '))
    const nodeCloner = (data: NodeContentData) => {
      return {
        ...data,
        children: data.children.map(n => {
          if (this.nodeMap.deleted(n.id)) {
            return null;
          } else {
            // console.log('node map', n.key)
            return this.nodeMap.get(n.id);
          }
        }).filter(identity) as Node[],
      }
    }

    const updateStats: string[] = [];
    while (updateOrder.size) {
      const { node } = updateOrder.pop()!;
      const isContentChanged = this.contentChanges.has(node.id);
      // clone node children only if the node content is changed

      if (!this.nodeMap.has(node.id)) {
        // node is in update path but is mutated explicitly
        const immutable = this.nodeMap.get(node.id)!;
        updateStats.push(`[immutable] ${immutable.name} ${immutable.key}`)
        // console.debug('immutable node found', node.id.toString(), node.renderVersion)
        const mutable = node.clone(nodeCloner) as ImmutableNode;
        mutable.renderVersion += 1
        if (isContentChanged) {
          // console.log('content updated', node.id.toString())
          mutable.contentVersion += 1
        }
        this.nodeMap.set(node.id, mutable);
        // console.debug('updating node', node.name, node.id.toString(), node.textContent, mutable.renderVersion);
      } else {
        // the node is explicitly mutated, convert it to immutable node
        const mutable = this.nodeMap.get(node.id)!;
        updateStats.push(`[mutable] ${mutable.name} ${mutable.key}`)
        // console.debug('mutable node found', mutable.key, mutable.textContent, mutable.renderVersion, mutable.props.prefix(LocalHtmlAttrPath))
        const clone = mutable.clone(nodeCloner);
        clone.renderVersion += 1

        if (clone.name == 'text') {
          // console.log('mutable node', node.id.toString(), clone.textContent, clone.renderVersion, Object.isFrozen(mutable))
        }

        if (isContentChanged) {
          // console.log('content updated', node.id.toString())
          clone.contentVersion += 1
        }
        this.nodeMap.set(node.id, clone);
      }
    }

    // console.log('[STATS]', updateStats.join(', '))

    return this;
  }


  // WARNING: inefficient implementation for validation of ideas only
  private normalize() {
    console.debug('unstable nodes', this.unstable.toArray().map(n => n.toString()).join(', '))
    const unstable = this.unstable.nodes(this.nodeMap);
    const nodes = sortNodesByDepth(unstable).reverse();
    const node = first(nodes);
    if (!node) {
      return
    }

    const actions = this.pm.normalize(node);
    if (!isEmpty(actions)) {
      console.log('normalizing')
      actions.forEach(action => {
        action.execute(this)
      })

      this.unstable.remove(node.id);

      console.log(actions, actions.map(a => a.toString()), 'actions normalized')
      this.normalize();
      return
    }

    this.normalizeSchema()
  }

  // normalize unstable nodes by inserting missing nodes as per the schema
  private normalizeSchema() {
    console.debug('OHH YEAAH')
  }

  updateContent(nodeId: NodeId, content: Node[] | string) {
    if (!this.drafting) {
      throw new Error("Cannot update content on a draft that is already committed");
    }

    const node = this.unfreeze(nodeId);
    node.descendants().forEach(n => this.addRemoved(n.id));

    // update state
    this.tm.updateContent(node, content);

    this.addUpdated(nodeId);
    this.contentChanges.add(nodeId);

    if (node.isTextContainer && isArray(content)) {
      node.updateProps({
        [PlaceholderPath]: content.length === 0 ? this.nodeMap.parent(node)?.props.get<string>(EmptyPlaceholderPath) ?? "" : ""
      });
    }

    return

    this.mutable(nodeId, node => {
      if (!node.isTextContainer && !node.isText) {
        throw new Error("Cannot update content on a node that is not a text container");
      }

      this.all(node, n => {
        if (n.eq(node)) return
        this.addRemoved(n.id);
      })

      node.updateContent(content);
      this.contentChanges.add(node.id);

      if (node.isTextContainer && isArray(content)) {
        node.updateProps({
          [PlaceholderPath]: content.length === 0 ? this.nodeMap.parent(node)?.props.get<string>(EmptyPlaceholderPath) ?? "" : ""
        });
      } else if (node.isText) {
        // NOTE(fix): when the text is updated, the parent should be updated as well
        // otherwise the pin on parent cant find the updated child text
        this.mutable(node.parentId!, parent => {
          const index = node.index;
          parent.remove(node);
          parent.insert(node, index);
        }, false)
      }

      // console.log('updating content', node.textContent);

      // console.log("updated draft content", node.textContent, node.renderVersion);

      node.descendants().forEach(child => {
        console.log('inserted content child', child.id.toString());
        this.nodeMap.set(child.id, child);
        this.removed.remove(child.id);
      })
    });
  }

  move(to: Point, node: Node) {
    if (!this.drafting) {
      throw new Error("Cannot move node to a draft that is already committed");
    }

    // moving node should be mutable wo that it can be updated
    if (Object.isFrozen(node)) {
      node = node.clone();
    }

    if (!this.get(node.id)) {
      throw Error("move node not found in state map");
    }

    const { parentId } = node;
    if (!parentId) {
      throw Error("move node does not have parent id");
    }

    const oldParent = this.get(parentId);
    if (!oldParent) {
      throw Error("move node does not have old parent");
    }

    this.mutable(parentId, parent => {
      this.updateDependents(node, UpdateDependent.Next);
      parent.remove(node);
    });

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

    if (Object.isFrozen(node)) {
      throw Error("cannot insert immutable node, it must be at least mutable at top level");
    }

    // mark moved/inserted nodes as inserted ones
    // these will not be rendered explicitly
    node.all(n => this.addInserted(n.id));

    if (type === "create") {
      // set empty placeholder of inserted node if needed
      if (node.isEmpty) {
        const placeholder = node.props.get<string>(EmptyPlaceholderPath) ?? "";
        // console.debug('empty placeholder', placeholder, node.id.toString())
        node.firstChild?.updateProps({
          [PlaceholderPath]: placeholder
        });
      }
    } else {
      this.nodeMap.set(node.id, node);
    }

    console.debug('inserting new item')
    return
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
    this.mutable(parentId, parent => {
      parent.children.forEach(ch => this.mutable(ch.id));
      parent.insert(node, 0);
      this.contentChanges.add(parent.id);
      this.unstable.add(parent.id);
    });
  }

  private append(parentId: NodeId, node: Node) {
    this.mutable(parentId, parent => {
      parent.insert(node, parent.size);
      this.contentChanges.add(parent.id);
      this.unstable.add(parent.id);
    });
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

    const parent = this.nodeMap.get(parentId);
    if (!parent) {
      throw new Error("Cannot insert node before a node that does not have a parent");
    }

    this.mutable(parentId, parent => {
      parent.insert(node, refNode.index);
      this.updateDependents(node, UpdateDependent.Next);
      this.contentChanges.add(parent.id);
      this.unstable.add(parent.id);
    });
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

    const parent = this.nodeMap.get(parentId);
    if (!parent) {
      throw new Error("Cannot insert node before a node that does not have a parent");
    }

    // console.debug('insert after', refNode.id.toString(), refNode.name, refNode.index, parent.children.length)
    this.mutable(parentId, parent => {
      this.updateDependents(refNode, UpdateDependent.Next);
      parent.insert(node, refNode.index + 1);
      this.updateDependents(refNode, UpdateDependent.Prev);
      this.contentChanges.add(parent.id);
      this.unstable.add(parent.id);
    });
  }

  remove(node: Node) {
    if (!this.drafting) {
      throw new Error("Cannot remove node from a draft that is already committed");
    }

    const parentId = node.parentId;
    if (!parentId) {
      throw new Error("Cannot remove node that does not have a parent");
    }

    const parent = this.unfreeze(parentId);
    parent.remove(node);

    // if parent title is empty, set placeholder from parent
    // if (parent.isTextContainer && parent.isEmpty) {
    //   const placeholder = this.nodeMap.parent(parent)?.props.get<string>(EmptyPlaceholderPath) ?? "";
    //   parent.updateProps({
    //     [PlaceholderPath]: placeholder
    //   });
    // }

    // bookkeeping
    this.addUpdated(parent.id);
    this.contentChanges.add(parent.id);
    node.all(n => this.addRemoved(n.id));
  }

  all(node: Node, fn: (node: Node) => void) {
    // callback at the beginning of the recursion to process the node
    fn(node);

    node.children.map(ch => {
      this.node(ch.id, n => {
        if (ch.parentId?.eq(node.id)) {
          this.all(n, fn);
        }
      });
    })
  }

  change(nodeId: NodeId, type: NodeType) {
    if (!this.drafting) {
      throw new Error("Cannot change name on a draft that is already committed");
    }

    this.unstable.add(nodeId);
    this.mutable(nodeId, node => {
      node.changeType(type);
      // node.nextSiblings?.forEach(ch => this.mutable(ch.id));
      this.updateDependents(node, UpdateDependent.Next);
      if (node.isContainer && node.firstChild?.isEmpty) {
        this.mutable(node.firstChild.id, child => {
          child.updateProps({
            [PlaceholderPath]: type.props.get<string>(EmptyPlaceholderPath) ?? ""
          });
        });
      }
    });
  }

  updateProps(nodeId: NodeId, props: Partial<NodePropsJson>) {
    if (!this.drafting) {
      throw new Error("Cannot change name on a draft that is already committed");
    }
    if (this.nodeMap.deleted(nodeId)) {
      if (props[SelectedPath] === false) {
        this.selected.remove(nodeId);
      }
      return;
    }
    // console.log('before update props', this.nodeMap.get(nodeId)?.properties.toKV());

    this.mutable(nodeId, node => {
      node.updateProps(props);
    });

    if (props[SelectedPath] === true) {
      this.selected.add(nodeId);
    }

    if (props[SelectedPath] === false) {
      this.selected.remove(nodeId);
    }

    // console.log('after update props', this.nodeMap.get(nodeId)?.properties.toKV());
  }

  updateSelection(selection: PointedSelection) {
    if (!this.drafting) {
      throw new Error("Cannot update selection on a draft that is already committed");
    }

    // console.log("update selection", selection.isInline);
    this.selection = selection;
    this.changes.add(SelectionChange.create(selection, this.state.selection.unpin()));
    return;

    // update empty placeholder if needed
    if (this.state.selection.isCollapsed) {
      if (!this.state.selection.isIdentity) {
        const {head: headPin} = this.state.selection;
        const {head} = this.state.selection.unpin();
        const node = this.nodeMap.get(head.nodeId);
        if (!node) {
          throw new Error("Cannot update selection on a draft that is already committed");
        }

        if (node.isEmpty) {
          this.mutable(head.nodeId, node => {
            const parent = this.nodeMap.parent(node);
            const emptyPlaceholder = parent?.props.get<string>(EmptyPlaceholderPath) ?? " ";
            if (!parent) return;
            node.updateProps({
              [PlaceholderPath]: emptyPlaceholder,
            });
            this.contentChanges.add(parent.id);
          });
        }
      }
    }

    // update focus placeholder if needed
    if (selection.isCollapsed && !selection.isIdentity) {
      const {head: headPin} = this.state.selection;
      const { head } = selection;
      const node = this.nodeMap.get(head.nodeId);
      if (!node) {
        throw new Error("Cannot update selection on a draft that is already committed");
      }

      if (node.isEmpty) {
        this.mutable(head.nodeId, node => {
          const parent = this.nodeMap.parent(node);
          const focusedPlaceholder = parent?.props.get<string>(FocusedPlaceholderPath) ?? "";
          if (!parent) return;
          node.updateProps({
            [PlaceholderPath]: focusedPlaceholder,
          });
        });
      }
    }

    // update focus marker if needed
    if (this.state.selection.tail.node.id.eq(this.selection.tail.nodeId)) {
      return
    }

    if (!this.state.selection.isInvalid) {
      this.mutable(this.state.selection.tail.node.id, node => {
        node.updateProps({
          [HasFocusPath]: '',
        })
      })
    }

    console.log('Selection', this.selection.head.eq(Point.IDENTITY))
    if (!this.selection.isInvalid) {
      this.mutable(this.selection.tail.nodeId, node => {
        node.updateProps({
          [HasFocusPath]: true,
        })
      })
    }
  }

  private updateBlockSelection(selection: PointedSelection) {
    // if (browser)
    const old = NodeIdSet.fromIds(this.state.selection.nodes.map(n => n.id));
    const after = selection.pin()!;
    if (after) {
      const nids = after.blocks.map(n => n.id);
      const now = NodeIdSet.fromIds(nids);
      console.log(nids, after.nodes, after.head.node, after.tail.node)

      this.selection = PointedSelection.create(selection.tail, selection.head, selection.origin);

      // find removed block selection
      old.diff(now).forEach(id => {
        this.mutable(id, node => {
          node.updateProps({
            [SelectedPath]: false
          });
        });
      })

      // find new block selection
      now.diff(old).forEach(id => {
        this.mutable(id, node => {
          console.log('selected node', node.name, node.id.toString());
          node.updateProps({
            [SelectedPath]: true
          });
        });
      })
    }
  }

  // check and update render dependents
  private updateDependents(node: Node, flag: number) {
    if (flag & UpdateDependent.Parent && node.parent?.type.spec.depends?.child) {
      this.mutable(node.parent.id, parent => {
        this.updateDependents(parent, UpdateDependent.Parent);
      })
    }

    // console.log('update prev', flag, node.id.toString(), node.prevSibling?.type.spec.depends?.prev)
    if(flag & UpdateDependent.Prev && node.prevSibling?.type.spec.depends?.next) {
      this.mutable(node.prevSibling.id, prev => {
        this.updateDependents(prev, UpdateDependent.Prev);
      })
    }

    // console.log('update next', flag, node.id.toString(), node.nextSibling?.type.spec.depends?.prev)
    if(flag & UpdateDependent.Next && node.nextSibling?.type.spec.depends?.prev) {
      this.mutable(node.nextSibling.id, next => {
        this.updateDependents(next, UpdateDependent.Next);
      })
    }
  }

  // creates a mutable copy of a node and adds it to the draft changes
  private mutable(id: NodeId, fn?: (node: Node) => void, changed = true) {
    // can not update a deleted node
    if (this.nodeMap.deleted(id)) {
      return
    }

    const node = this.nodeMap.get(id);
    if (!node) {
      throw new Error("Cannot mutate node that does not exist");
    }

    // console.log('before mutable', id.toString(), node.textContent, this.nodeMap.has(id), node.renderVersion, node)
    const clone = this.nodeMap.has(id) ? node : node.clone();
    const mutable = DraftNode.from(this.state.scope, clone, this.changes)
    // console.log('after mutable', id.toString(), mutable.textContent, this.nodeMap.has(id), mutable.renderVersion, mutable)

    fn?.(mutable);

    // console.log('', mutable.name, id.toString(), this.inserted.has(id), this.contentChanges.has(id))

    // newly inserted nodes are not marked updated for render
    // their parent will be marked updated
    if (!this.inserted.has(id)) {
      if (changed) {
        this.addUpdated(id);
      }
    } else {
      console.debug('node is not marked updated, already marked inserted', id.toString())
    }
    // put the mutable node into the draft map
    this.nodeMap.set(id, mutable);

    return mutable;
  }

  private unfreeze(id: NodeId): MutableNode {
    const node = this.node(id);
    const root = this.root();
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

  private root() {
    const root = this.nodeMap.get(NodeId.ROOT);
    if (!root) {
      throw new Error("Cannot mutate node that does not exist");
    }

    return root;
  }

  private delete(id: NodeId) {
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




// traps the changes to the node and records them into the draft
class Transformer {
  constructor(private readonly changes: StateChanges) {}

  setParent(node: Node, parent: Node) {
    console.log(p14('%c[trap]'), "color:green", 'set parent', node.key);
    node.setParent(parent)
  }

  setParentId(node: Node, parentId: Optional<NodeId>) {
    console.log(p14('%c[trap]'), "color:green", 'set parent id', node.key);
    node.setParentId(parentId)
  }

  changeType(node: Node, type: NodeType) {
    console.log(p14('%c[trap]'), "color:green", 'change type', node.id.toString(), node.renderVersion);
    this.changes.add(NameChange.create(node.id, node.type.name, type.name));

    node.changeType(type);
  }

  insert(parent: Node, node: Node,  index: number) {
    console.log(p14('%c[trap]'), "color:green", 'insert', node.key);
    const updated = parent.insert(node, index);

    const {path} = node;
    this.changes.add(InsertChange.create(node.id, node.id, path));
    this.changes.dataMap.set(node.id, node.data);
  }

  remove(node: Node, parent: Node) {
    const {path} = node;
    this.changes.add(RemoveChange.create(parent.id, node.id, path));
    this.changes.dataMap.set(node.id, node.data);
    parent.remove(node);
  }

  insertText(node: Node, text: string, offset: number) {
    console.log(p14('%c[trap]'), "color:green", 'add text', node.key)
    this.changes.add(TextChange.create(node.id, offset, text, 'insert'));
    node.insertText(text, offset)
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
  updateContent(node: Node, content: Node[]|string) {
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
    if (oldText !== newText) {
      this.changes.add(SetContentChange.create(node.id, path, oldText, newText));
    }

    if (oldChildren !== newChildren) {
      this.changes.add(SetContentChange.create(node.id, path, oldChildren.map(n => n.id), newChildren.map(n => n.id)))
      oldChildren.forEach(n => this.changes.dataMap.set(n.id, n.data));
      newChildren.forEach(n => this.changes.dataMap.set(n.id, n.data));
    }
  }

  updateProps(node: Node, props: NodePropsJson) {
    console.log(p14('%c[trap]'), "color:green", 'update', node.key)
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
    this.queue.add({ node, depth });
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
