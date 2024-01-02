import {
  ActionOrigin,
  Draft as CoreDraft,
  EmptyPlaceholderPath,
  FocusedPlaceholderPath,
  isPassiveHidden, LocalHtmlAttrPath,
  Node, NodeContentData,
  NodeId,
  NodeIdSet,
  NodePropsJson,
  NodeType,
  PlaceholderPath,
  Point,
  PointAt,
  PointedSelection,
  State as CoreState,
} from "@emrgen/carbon-core";
import {Optional} from "@emrgen/types";
import {ImmutableState} from "./ImmutableState";
import {identity, isArray} from "lodash";
import FastPriorityQueue from "fastpriorityqueue";
import {ImmutableNodeMap} from "./ImmutableNodeMap";
import {Scope} from "./Scope";
import {ImmutableNodeContent} from "./ImmutableNodeContent";
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
import {p14} from "@emrgen/carbon-core/src/core/Logger";

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
  state: ImmutableState;
  nodeMap: ImmutableNodeMap;
  selection: PointedSelection;
  updated: NodeIdSet; // tracks changed nodes
  contentChanges: NodeIdSet = NodeIdSet.empty(); // tracks nodes with content changes
  removed: NodeIdSet = NodeIdSet.empty(); // tracks removed nodes
  changes: StateChanges = StateChanges.empty();
  inserted: NodeIdSet = NodeIdSet.empty();

  private drafting = true;

  constructor(state: ImmutableState, origin: ActionOrigin) {
    this.origin = origin;
    this.state = state;
    this.nodeMap = ImmutableNodeMap.from(state.nodeMap);
    this.updated = new NodeIdSet();
    this.selection = state.selection.unpin(origin);
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
      Scope.set(scope, this.nodeMap)
      fn(this);
      const state = this.commit(3);
      Scope.set(scope, state.nodeMap)

      this.dispose();
      return state;
    } catch (e) {
      Scope.set(scope, this.state.nodeMap);
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
    const after = selection.pin(nodeMap);
    if (!after) {
      throw new Error("Cannot commit draft with invalid pinned selection");
    }

    updated.freeze();
    nodeMap.contracts(2)
    // nodeMap.freeze();
    after.freeze();

    const newState = new ImmutableState({
      previous: state.clone(depth - 1),
      scope: state.scope,
      content,
      selection: after,
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

    // remove deleted nodes from changed list
    // this will prevent from trying to render deleted nodes
    this.updated.toArray().forEach(id => {
      // console.log('checking deleted', id.toString(), this.nodeMap.deleted(id));
      if (this.nodeMap.deleted(id)) {
        this.updated.remove(id);
      }
      // console.log('changed node id', id.toString())
      // remove the hidden nodes
      this.node(id, (node) => {
        // console.log('changed node id', id.toString(), isPassiveHidden(node))
        if (isPassiveHidden(node) || node.isCollapseHidden) {
          // console.log('removing hidden node', node.id.toString());
          this.updated.remove(id);
        }
      })
    });

    this.contentChanges.nodes(this.nodeMap).forEach(node => {
      node.parents.forEach(parent => {
        this.contentChanges.add(parent.id);
      })
    })

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

  updateContent(nodeId: NodeId, content: Node[] | string) {
    if (!this.drafting) {
      throw new Error("Cannot update content on a draft that is already committed");
    }

    this.mutable(nodeId, node => {
      if (!node.isTextContainer && !node.isText) {
        throw new Error("Cannot update content on a node that is not a text container");
      }

      node.descendants().forEach(child => {
        // console.log('removing content child', child.id.toString());
        this.delete(child.id);
      })

      if (node.isTextContainer && isArray(content)) {
        node.updateProps({
          [PlaceholderPath]: content.length === 0 ? this.nodeMap.parent(node)?.props.get<string>(EmptyPlaceholderPath) ?? "" : ""
        });
      } else if (node.isText) {

      }

      // console.log('updating content', node.textContent);
      node.updateContent(content);
      this.contentChanges.add(node.id);
      // console.log("updated draft content", node.textContent, node.renderVersion);

      node.descendants().forEach(child => {
        console.log('inserted content child', child.id.toString());
        this.nodeMap.set(child.id, child);
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

  insert(at: Point, node: Node, type: "create" | "move" = "create") {
    if (!this.drafting) {
      throw new Error("Cannot insert node to a draft that is already committed");
    }

    if (Object.isFrozen(node)) {
      throw Error("cannot insert immutable node, it must be at least mutable at top level");
    }

    // mark moved/inserted nodes as inserted ones
    // these will not be rendered explicitly
    node.all(n => {
      this.inserted.add(n.id);
    })

    if (type === "create") {
      node.all(n => {
        // console.debug("inserting node", n.id.toString(), n.name);
        this.nodeMap.set(n.id, n);
      });

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
    });
  }

  private append(parentId: NodeId, node: Node) {
    this.mutable(parentId, parent => {
      parent.insert(node, parent.size);
      this.contentChanges.add(parent.id);
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

    this.mutable(parentId, parent => {
      this.updateDependents(refNode, UpdateDependent.Next);
      parent.insert(node, refNode.index + 1);
      this.updateDependents(refNode, UpdateDependent.Prev);
      this.contentChanges.add(parent.id);
    });
  }

  remove(node: Node) {
    if (!this.drafting) {
      throw new Error("Cannot remove node from a draft that is already committed");
    }

    if (Object.isFrozen(node)) {
      throw Error("cannot remove immutable node, it must be at least mutable at top level");
    }

    const target = this.nodeMap.get(node.id);
    if (!target) {
      throw new Error("Cannot remove node that does not exist");
    }

    const parentId = node.parentId;
    if (!parentId) {
      throw new Error("Cannot remove node that does not have a parent");
    }

    this.mutable(parentId, parent => {
      this.updateDependents(node, UpdateDependent.Next);
      this.updateDependents(node, UpdateDependent.Prev);
      parent.remove(node);
      this.contentChanges.add(parent.id);

      // if parent title is empty, set placeholder from parent
      if (parent.isTextContainer && parent.isEmpty) {
        const placeholder = this.nodeMap.parent(parent)?.props.get<string>(EmptyPlaceholderPath) ?? "";
        parent.updateProps({
          [PlaceholderPath]: placeholder
        });

        // console.log(parent.properties.toKV());
      }
    });

    node.all(n => {
      this.delete(n.id);
    });
  }

  change(nodeId: NodeId, type: NodeType) {
    if (!this.drafting) {
      throw new Error("Cannot change name on a draft that is already committed");
    }
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
      return;
    }
    // console.log('before update props', this.nodeMap.get(nodeId)?.properties.toKV());

    this.mutable(nodeId, node => {
      node.updateProps(props);
    });

    // console.log('after update props', this.nodeMap.get(nodeId)?.properties.toKV());
  }

  updateSelection(selection: PointedSelection) {
    if (!this.drafting) {
      throw new Error("Cannot update selection on a draft that is already committed");
    }

    // console.log("update selection", selection.isInline);
    this.selection = selection;
    this.changes.add(SelectionChange.create(selection, this.state.selection.unpin()));

    // update selection nodes
    if (selection.isInline) {
      // const old = NodeIdSet.fromIds(this.state.selection.nodes.map(n => n.id));
      // const after = selection.pin(this.nodeMap)!;
      // if (after) {
      //   const nids = after.blocks.map(n => n.id);
      //   const now = NodeIdSet.fromIds(nids);
      //   console.log(nids, after.nodes, after.head.node, after.tail.node)
      //
      //   this.selection = PointedSelection.create(selection.tail, selection.head, nids, selection.origin);
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
      //       console.log('selected node', node.name, node.id.toString(), node.props.toKV());
      //       node.updateProps({
      //         [SelectedPath]: true
      //       });
      //     });
      //   })
      // }
    }

    // update empty placeholder if needed
    if (this.state.selection.isInline && this.state.selection.isCollapsed) {
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
    if (selection.isCollapsed && selection.isInline && !selection.isIdentity) {
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
  private mutable(id: NodeId, fn?: (node: Node) => void) {
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
      this.updated.add(id);
    } else {
      console.debug('node is not marked updated, already marked inserted', id.toString())
    }
    // put the mutable node into the draft map
    this.nodeMap.set(id, mutable);

    return mutable;
  }

  private node(id: NodeId, fn: (node: Node) => void) {
    const node = this.nodeMap.get(id);
    if (!node) {
      throw new Error("Cannot mutate node that does not exist");
    }

    fn(node);
  }

  private delete(id: NodeId) {
    this.nodeMap.delete(id);
    this.removed.add(id);
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
class DraftNode extends ImmutableNode {
  static from(scope: Symbol, node: Node, changes: StateChanges, ) {

    // return node;
    if (node instanceof DraftNode) {
      return node;
    }

    return new DraftNode(scope, node, changes);
  }

  private constructor(scope: Symbol,protected content: Node, private readonly changes: StateChanges) {
    super(scope, content);
    // NOTE: without this the React render will fail to update the UI
    this.contentVersion = content.contentVersion;
    this.renderVersion = content.renderVersion;
  }

  setParent(parent: Optional<Node>) {
    console.log(p14('%c[trap]'), "color:green", 'set parent', this.id.toString(), this.textContent, this.renderVersion);
    super.setParent(parent);
  }

  setParentId(parentId: Optional<NodeId>) {
    console.log(p14('%c[trap]'), "color:green", 'set parent id', this.id.toString(), this.textContent, this.renderVersion);
    super.setParentId(parentId);
  }

  changeType(type: NodeType) {
    console.log(p14('%c[trap]'), "color:green", 'change type', this.id.toString(), this.textContent, this.renderVersion);
    const oldType = this.type.name
    super.changeType(type);
    this.changes.add(NameChange.create(this.id, oldType, type.name));
  }

  insert(node: ImmutableNode, index: number) {
    console.log(p14('%c[trap]'), "color:green", 'insert', this.id.toString(), this.textContent, this.renderVersion);
    super.insert(node, index);

    this.changes.add(InsertChange.create(this.id, node.id, index));
    this.changes.dataMap.set(node.id, node.data);
  }

  remove(node: ImmutableNode) {
    console.log(p14('%c[trap]'), "color:green", 'remove', this.id.toString(), this.textContent, this.renderVersion)
    const index = node.index;
    super.remove(node);

    this.changes.add(RemoveChange.create(this.id, node.id, node.index));
    this.changes.dataMap.set(node.id, node.data);
  }

  insertText(text: string, offset: number) {
    console.log(p14('%c[trap]'), "color:green", 'add text', this.id.toString(), this.textContent, this.renderVersion)
    super.insertText(text, offset);
    this.changes.add(TextChange.create(this.id, offset, text, 'insert'));
  }

  removeText(offset: number, length: number) {
    console.log(p14('%c[trap]'), "color:green", 'remove text', this.id.toString(), this.textContent, this.renderVersion)
    super.removeText(offset, length);

   this.changes.add(TextChange.create(this.id, offset, this.textContent.slice(offset, offset + length), 'remove'));
  }

  addLink(name: string, node: ImmutableNode) {
    console.log(p14('%c[trap]'), "color:green", 'link', this.id.toString(), this.textContent, this.renderVersion)
    const oldLink = this.links[name]
    super.addLink(name, node);

    if (oldLink !== node) {
      this.changes.add(LinkChange.create(this.id, oldLink?.id, node.id));
    }
  }

  removeLink(name: string): Optional<Node> {
    console.log(p14('%c[trap]'), "color:green", 'unlink', this.id.toString(), this.textContent, this.renderVersion)
    return super.removeLink(name);
  }

  // update content is valid only for textContainer and text nodes
  //
  updateContent(content: ImmutableNode[] | string) {
    console.log(p14('%c[trap]'), "color:green", 'content', this.id.toString(), this.textContent, this.renderVersion);
    const oldText = this.textContent;
    const oldChildren = this.children;
    super.updateContent(content);
    const newText = this.textContent;
    const newChildren = this.children;
    // console.log('update content', oldText, newText, oldChildren, newChildren)

    const isUpdated = oldText !== newText || oldChildren !== newChildren;
    if (!isUpdated) {
      console.warn("unnecessary content update detected. possibly the node is immutable")
    }

    if (oldText !== newText) {
      this.changes.add(SetContentChange.create(this.id, oldText, newText));
    }

    if (oldChildren !== newChildren) {
      this.changes.add(SetContentChange.create(this.id, oldChildren.map(n => n.id), newChildren.map(n => n.id)))
      oldChildren.forEach(n => this.changes.dataMap.set(n.id, n.data));
      newChildren.forEach(n => this.changes.dataMap.set(n.id, n.data));
    }
  }

  updateProps(props: NodePropsJson) {
    console.log(p14('%c[trap]'), "color:green", 'update', this.id.toString(), this.textContent, props);
    super.updateProps(props);
  }

  clone(map: (node: NodeContentData) => NodeContentData = identity): Node {
    // console.log(p14('%c[trap]'), "color:green", 'clone', this.id.toString(), this.textContent, this.renderVersion);
    return super.clone(map);
  }
}

// NOTE: this is a priority queue that sorts nodes by depth
class NodeDepthPriorityQueue {
  private queue: FastPriorityQueue<NodeDepthEntry>;

  static from(nodes: Node[], order: "asc" | "desc" = "asc") {
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
