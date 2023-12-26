import {IntoNodeId, no, NodeId, NodeProps, NodePropsJson, NodeType, yes} from "@emrgen/carbon-core";
import {Optional, Predicate, With} from "@emrgen/types";
import {findIndex, merge, noop, reverse} from "lodash";
import {Store} from "solid-js/store/types/store";
import {createMutable} from "solid-js/store";

export type TraverseOptions = {
  order: 'pre' | 'post';
  direction: 'forward' | 'backward';
  // checks parent with the predicate before moving to parent siblings
  parent?: boolean;
  gotoParent: boolean;
  skip: Predicate<Node>;
}

// immutable node
interface Node extends IntoNodeId {
  id: NodeId;
  parentId: Optional<NodeId>;
  type: NodeType;
  children: Node[];
  textContent: string;
  properties: NodeProps;
  links: Record<string, Node>;
  linkName: string;

  // type helpers
  isEmpty: boolean;
  isVoid: boolean;
  isInline: boolean;
  isLeaf: boolean;
  isInlineAtom: boolean;
  isText: boolean;
  isTextContainer: boolean;
  isContainer: boolean;

  key: string;
  parent: Optional<Node>;
  parents: Node[];
  chain: Node[];
  depth: number;
  index: number;
  nextSibling: Optional<Node>;
  prevSibling: Optional<Node>;
  nextSiblings: Node[];
  prevSiblings: Node[];
  path: number[];

  atPath(path: number[]): Optional<Node>;
  child(index: number): Optional<Node>;
  each(fn: With<Node>, opts?: Partial<TraverseOptions>): void;
  all(fn: (node: Node) => void): void;
  find(fn: Predicate<Node>, opts?: Partial<TraverseOptions>): Optional<Node>;
  prev(fn?: Predicate<Node>, opts?: Partial<TraverseOptions>, gotoParent?:boolean): Optional<Node>;
  next(fn?: Predicate<Node>, opts?: Partial<TraverseOptions>, gotoParent?:boolean): Optional<Node>;
  walk(fn: Predicate<Node>, opts?: Partial<TraverseOptions>): boolean;
  preorder(fn: Predicate<Node>, opts?: Partial<TraverseOptions>): boolean
  postorder(fn: Predicate<Node>, opts?: Partial<TraverseOptions>): boolean
  descendants(fn?: Predicate<Node>, opts?: TraverseOptions): Node[];
  commonAncestor(node: Node): Optional<Node>;

  eq(node: Node): boolean;
}

// mutable node
interface MutableNode {
  setParentId(parentId: Optional<NodeId>): void;
  setParent(parent: Optional<Node>): void;
  insert(node: Node, index: number): void;
  insertText(text: string, index: number): void;
  remove(node: Node): void;
  updateContent(content: Node[] | string): void;
  updateProps(props: NodePropsJson): void;
}

interface NodeContent extends MutableNode {
  id: NodeId;
  type: NodeType;
  parentId: Optional<NodeId>;
  parent: Optional<Node>;
  textContent: string;
  children: Node[];
  clone(): NodeContent;
  freeze(): NodeContent;
}

export class Block implements MutableNode, Node {

  static create(content: NodeContent): Block {
    return new Block(content);
  }

  constructor(private content: NodeContent) {}

  get id(): NodeId {
    return this.content.id;
  }

  get type(): NodeType {
    return this.content.type;
  }

  // get id(): NodeId {
  //   return this.content.id;
  // }

  get parent(): Optional<Node> {
    return this.content.parent;
  }

  get parentId(): Optional<NodeId> {
    return this.content.parentId;
  }

  get textContent(): string {
    return this.content.textContent;
  }

  get children(): Node[] {
    return this.content.children;
  }

  nodeId(): NodeId {
    return this.id;
  }

  get isEmpty(): boolean {
    if (this.isInlineAtom) return false;
    if (this.isInline) return !this.textContent;
    return this.children.every(n => n.isEmpty);
  }

  get isVoid(): boolean {
    return this.children.length === 0;
  }

  get isLeaf() {
    return this.children.length === 0;
  }

  get isInline(): boolean {
    return false;
  }

  get isInlineAtom(): boolean {
    return false;
  }

  get isText(): boolean {
    return this.type.isText;
  }

  get isTextContainer(): boolean {
    return this.type.isBlock && this.type.inlineContent;
  }

  get isContainer(): boolean {
    return this.type.isBlock && !this.type.inlineContent;
  }

  get index(): number {
    return findIndex(this.parent?.children, (child) => child.id.eq(this.id));
  }

  get nextSibling(): Optional<Node> {
    return this.parent?.children[this.index + 1] ?? null;
  }

  get prevSibling(): Optional<Node> {
    return this.parent?.children[this.index - 1] ?? null;
  }

  get nextSiblings(): Node[] {
    return this.parent?.children.slice(this.index + 1) ?? [];
  }

  get prevSiblings(): Node[] {
    return this.parent?.children.slice(0, this.index) ?? [];
  }

  get path(): number[] {
    const path: number[] = [];
    let node: Optional<Node> = this;
    while (node) {
      path.push(node.index);
      node = node.parent;
    }

    return path.reverse();
  }

  get depth(): number {
    let depth = 0;
    let node: Optional<Node> = this;
    while (node?.parent) {
      node = node.parent;
      depth += 1;
    }

    return depth;
  }

  get properties(): NodeProps {
    return NodeProps.empty();
  }

  get links(): Record<string, Node> {
    return {};
  };

  get linkName(): string {
    return "";
  }

  get key(): string {
    return this.id.toString();
  }

  get chain(): Node[] {
    return this.parents.concat(this);
  }

  get parents(): Node[] {
    let parents: Node[] = [];
    let parent: Optional<Node> = this.parent;
    while (parent) {
      parents.push(parent);
      parent = parent.parent;
    }

    return parents;
  }

  atPath(path: number[]): Optional<Node> {
    let node: Optional<Node> = this;
    for (let i = 0; i < path.length; i++) {
      node = node?.child(path[i]);
    }

    return node;
  }

  child(index: number): Optional<Node> {
    return this.children[index] ?? null;
  }

  commonAncestor(node: Node): Node {
    if (this.eq(node)) {
      return this;
    }

    const selfParents = reverse(this.chain);
    const nodeParents = reverse(node.chain);

    let parent = selfParents[0];
    for (let i = 0; i < selfParents.length; i += 1) {
      if (selfParents[i] !== nodeParents[i]) {
        break;
      }
      parent = selfParents[i];
    }

    return parent;
  }

  each(fn: With<Node>, opts: Partial<TraverseOptions> = {}): void {
    const {direction = 'forward'} = opts
    const { children } = this;
    if (direction === 'forward') {
      for (let i = 0; i < children.length; i++) {
        fn(children[i])
      }
    } else {
      for (let i = children.length - 1; i >= 0; i--) {
        fn(children[i])
      }
    }
  }

  all(fn: With<Node>): void {
    this.preorder(n => {
      fn(n)
      return false
    })
  }

  find(fn: Predicate<Node>, opts?: Partial<TraverseOptions>): Optional<Node> {
    let found: Optional<Node> = null;
    opts = merge({order: 'pre', direction: 'forward', skip: noop}, opts)
    // eslint-disable-next-line no-return-assign
    const collect: Predicate<Node> = node => !!(fn(node) && (found = node));

    opts.order === 'pre' ? this.preorder(collect, opts) : this.postorder(collect, opts);
    return found;
  }


  // NOTE: the parent chain is not searched for the next node
  prev(fn: Predicate<Node> = yes, opts: Partial<TraverseOptions> = {}, gotoParent = true): Optional<Node> {
    const options = merge({order: 'post', direction: 'backward', skip: noop, parent: false}, opts) as TraverseOptions;
    // if (options.skip(this)) return

    const sibling = this.prevSibling;
    let found: Optional<Node> = null;
    const collect: Predicate<Node> = node => !!(fn(node) && (found = node));

    // check in sibling tree
    if (sibling && !options.skip(sibling)) {
      (options.order == 'pre' ? sibling?.preorder(collect, options) : sibling?.postorder(collect, options))
    }
    if (found) return found;

    // pass the search role to prev sibling
    found = sibling?.prev(fn, options, false);
    if (found) return found;

    // no siblings have the target, maybe we want to go above and beyond
    if (!gotoParent || !this.parent) return null

    // check if parent is the target
    if (options.parent && fn(this.parent)) return this.parent;

    // pass the search role to the parent
    return this.parent.prev(fn, options, gotoParent);
  }

  // NOTE: the parent chain is not searched for the next node
  // check if next siblings' tree can fulfill predicate
  // otherwise try parent next
  next(fn: Predicate<Node> = yes, opts: Partial<TraverseOptions> = {}, gotoParent = true): Optional<Node> {
    const options = merge({order: 'post', direction: 'forward', skip: noop, parent: false}, opts) as TraverseOptions;
    // if (options.skip(this)) return

    const sibling = this.nextSibling;
    let found: Optional<Node> = null;
    const collect: Predicate<Node> = node => !!(fn(node) && (found = node));
    if (sibling && !options.skip(sibling)) {
      (options.order == 'pre' ? sibling?.preorder(collect, options) : sibling?.postorder(collect, options))
    }

    if (found) return found;

    // pass the search role to next sibling
    found = sibling?.next(fn, options, false);
    if (found) return found;

    // no siblings have the target, maybe we want to go above and beyond
    if (!gotoParent || !this.parent) return null

    // check if parent is the target
    if (options.parent && fn(this.parent)) return this.parent;

    // pass the search role to the parent
    return this.parent.next(fn, options, gotoParent);
  }

  walk(fn: Predicate<Node>, opts: Partial<TraverseOptions> = {}): boolean {
    const {order = 'pre', direction = 'forward'} = opts;
    const done = order == 'pre' ? this.preorder(fn, opts) : this.postorder(fn, opts);

    // without the () brackets this will be wrong
    return done || (direction === 'forward' ? !!this.next(fn, opts) : !!this.prev(fn, opts));
  }

  // fn should return true if the target node was found
  preorder(fn: Predicate<Node> = yes, opts: Partial<TraverseOptions> = {}): boolean {
    const {direction = 'forward', skip = no} = opts;
    if (skip(this)) return false

    const {children} = this;
    return direction === 'forward'
      ? fn(this) || children.some(n => n.preorder(fn, opts))
      : fn(this) || children.slice().reverse().some(ch => ch.preorder(fn, opts))
  }

  postorder(fn: Predicate<Node>, opts: Partial<TraverseOptions> = {}): boolean {
    const {direction = 'forward', skip = no} = opts;
    if (skip(this)) return false

    const {children} = this;
    return direction === 'forward'
      ? children.some(n => n.postorder(fn, opts)) || fn(this)
      : children.slice().reverse().some(ch => ch.postorder(fn, opts)) || fn(this)
  }

  descendants(fn: Predicate<Node> = yes, opts?: TraverseOptions): Node[] {
    const nodes: Node[] = [];
    const collect: Predicate<Node> = node => !!(fn(node) && nodes.push(node));

    this.each(child => child.preorder(node => collect(node), opts));
    return nodes;
  }

  eq(node: Node): boolean {
    return this.id.eq(node.id)
  }

  setParentId(parentId: Optional<NodeId>): void {
    this.content.setParentId(parentId);
  }
  setParent(parent: Optional<Node>) {
    this.content.setParent(parent);
  }
  insert(node: Node, index: number) {
    this.content.insert(node, index);
  }
  remove(node: Node) {
    this.content.remove(node);
  }
  updateContent(content: Node[] | string) {
    this.content.updateContent(content);
  }
  updateProps(props: NodePropsJson): void {
    this.content.updateProps(props)
  }
  insertText(text: string, index: number): void {
    this.content.insertText(text, index);
  }
}

export class SolidNodeContent implements MutableNode {
  id: NodeId;
  store: Store<{
    textContent: string;
    children: Node[];
    parent: Optional<Node>;
    parentId: Optional<NodeId>;
    type: NodeType;
  }>;

  get textContent(): string {
    return this.store.textContent;
  }

  get children(): Node[] {
    return this.store.children;
  }

  get parent(): Optional<Node> {
    return this.store.parent;
  }

  get parentId(): Optional<NodeId> {
    return this.store.parentId;
  }

  get type(): NodeType {
    return this.store.type;
  }

  static create(id: NodeId, type: NodeType, content: Node[] | string): SolidNodeContent {
    const store = createMutable({
      textContent: "",
      children: [],
      parent: null,
      parentId: null,
      type,
    });

    const node = new SolidNodeContent(id, store);
    node.updateContent(content);
    return node;
  }

  constructor(id: NodeId, store: SolidNodeContent['store'] ) {
    this.id = id;
    this.store = store;
  }

  setParentId(parentId: Optional<NodeId>): void {
    this.store.parentId = parentId;
  }

  insert(node: Node, index: number): void {
  }

  insertText(text: string, index: number): void {
  }

  remove(node: Node): void {
  }

  setParent(parent: Optional<Node>): void {
  }

  updateContent(content: Node[] | string): void {
  }

  updateProps(props: NodePropsJson): void {
  }

  clone(): NodeContent {
    return null as unknown as NodeContent;
  }

  freeze(): NodeContent {
    return null as unknown as NodeContent;
  }
}

const solidNode = Block.create(SolidNodeContent.create(NodeId.IDENTITY, NodeType.NULL, []))
