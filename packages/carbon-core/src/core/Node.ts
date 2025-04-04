import { Optional, Predicate, With } from "@emrgen/types";
import EventEmitter from "events";
import { entries, findIndex, first, identity, isArray, last, merge, noop, reverse } from "lodash";
import { NODE_CACHE } from "./CarbonCache";
import { classString } from "./Logger";
import { Mark } from "./Mark";
import { NodeContent, NodeContentData, NodeData, PlainNodeContent } from "./NodeContent";
import { IntoNodeId, NodeId } from "./NodeId";
import { NodeMap } from "./NodeMap";
import {
  ActivatedPath,
  AtomContentPath,
  AtomSizePath,
  CollapsedPath,
  CollapseHidden,
  MarksPath,
  NodeProps,
  NodePropsJson,
  OpenedPath,
  PlainNodeProps,
  SelectedPath,
} from "./NodeProps";
import { NodeType } from "./NodeType";
import { NodeView } from "./NodeView";
import { no, yes } from "./types";

export type TraverseOptions = {
  // pre-order or post-order traversal
  order: "pre" | "post";
  // forward or backward traversal
  direction: "forward" | "backward";
  // checks parent with the predicate before moving to parent siblings
  parent?: boolean;
  // checks if the node is a boundary for the traversal
  gotoParent: boolean;
  // stop the traversal if the predicate returns true
  boundary: Predicate<Node>;
  // skip the node if the predicate returns true
  skip: Predicate<Node>;
};

export type Path = (number | string)[];
export type MutableNode = Node;

export interface NodeJSONOption {
  props?: Record<string, any>;
}

export class Node extends EventEmitter implements IntoNodeId {
  protected content: NodeContent;

  // useful for debugging
  _contentVersion: number = 0;
  // useful for debugging
  _renderVersion: number = 0;

  get contentVersion() {
    return this._contentVersion;
  }

  get renderVersion() {
    return this._renderVersion;
  }

  set contentVersion(version: number) {
    this._contentVersion = version;
  }

  set renderVersion(version: number) {
    this._renderVersion = version;
  }

  static IDENTITY = new Node(
    PlainNodeContent.create({
      id: NodeId.IDENTITY,
      type: NodeType.IDENTITY,
      parentId: null,
      parent: null,
      textContent: "",
      children: [],
      linkName: "",
      links: {},
      props: PlainNodeProps.empty(),
    }),
  );

  static NULL = new Node(
    PlainNodeContent.create({
      id: NodeId.NULL,
      type: NodeType.NULL,
      parentId: null,
      parent: null,
      textContent: "",
      children: [],
      linkName: "",
      links: {},
      props: PlainNodeProps.empty(),
    }),
  );

  static SKIP = new Node(
    PlainNodeContent.create({
      id: NodeId.SKIP,
      type: NodeType.SKIP,
      parentId: null,
      parent: null,
      textContent: "",
      children: [],
      linkName: "",
      links: {},
      props: PlainNodeProps.empty(),
    }),
  );

  // don't use this constructor directly, use NodeFactory
  constructor(content: NodeContent) {
    super();
    this.content = content;
  }

  get data(): NodeData {
    return this.content.data;
  }

  unwrap(): NodeContentData {
    const unwrapped = this.content.unwrap();
    unwrapped.contentVersion = this.contentVersion;
    unwrapped.renderVersion = this.renderVersion;

    return unwrapped;
  }

  findParent(fn: Predicate<Node>): Optional<Node> {
    let parent: Optional<Node> = this.parent;
    while (parent) {
      if (fn(parent)) return parent;
      parent = parent.parent;
    }
  }

  get parent(): Optional<Node> {
    return this.content.parent;
  }

  get id(): NodeId {
    return this.content.id;
  }

  get parentId(): Optional<NodeId> {
    return this.content.parentId;
  }

  get type(): NodeType {
    return this.content.type;
  }

  get linkName(): string {
    return this.content.linkName;
  }

  get links(): Record<string, Node> {
    return this.content.links;
  }

  get props(): NodeProps {
    return this.content.props;
  }

  get marks() {
    return this.props.get(MarksPath, []).map((m) => Mark.fromJSON(m));
  }

  get view(): NodeView {
    return NODE_CACHE.get(this.contentKey, () => {
      // console.log(`NODE VIEW CREATED for: ${this.name}`, this.key);
      return new NodeView(this);
    });
  }

  get key() {
    return `${this.id.id}`;
  }

  get contentKey() {
    return `${this.id.id}`;
  }

  get name() {
    return this.type.name;
  }

  get isLinked() {
    return !!this.linkName && this.parentId;
  }

  get isActive() {
    return this.props.get(ActivatedPath);
  }

  get isZero() {
    return this.type.isZero;
  }

  get isSelected() {
    return this.props.get(SelectedPath);
  }

  get isOpen() {
    return this.props.get(OpenedPath);
  }

  get size(): number {
    if (this.isInlineAtom) return 1;
    if (this.isBlockAtom) return 0;
    return this.content.size;
  }

  get isFrozen() {
    return false;
  }

  // starting from left of <a> to end of </a>
  // if total focus size is needed for a block is
  // (the sum of focus size of all children - (size - 1)) + 2
  get stepSize(): number {
    // two steps to enter and exit the text node
    if (this.isText) return this.textContent.length + 2;
    if (this.isInlineAtom && this.isFocusable) {
      return this.focusSize + 2;
    }

    if ((this.isBlock && this.isVoid) || this.isZero) {
      return 3;
    }

    // once step to cross the block
    if (this.isIsolate) {
      return 1;
    }

    // two steps to enter and exit the block
    return this.children.map((n) => n.stepSize).reduce((s, n) => s + n, 2);
  }

  // focus steps count within the node
  // start and end locations are within the node
  get focusSize(): number {
    if (this.isZero) return 1;
    // if (this.name === "newline") return 1;

    if (this.isInlineAtom && this.isFocusable) {
      return this.props.get(AtomSizePath) ?? this.textContent.length;
    }
    // if (this.isEmpty || this.isInlineAtom) return 1;
    // if (this.isBlockAtom) return 0;
    if (this.isText) return this.textContent.length;
    // if (this.isInline) return this.textContent.length;

    // focus size is the sum of focus size of all children
    return this.children.reduce((fs, n) => {
      return fs + n.focusSize;
    }, 0);
  }

  // focus can be within the node, including any descendants node
  get hasFocusable() {
    // if (!this.isBlock) return false;
    if (this.isAtom) return false;
    if (this.isBlock && this.isFocusable && this.isEmpty) return true;
    return this.find((n) => {
      if (n.eq(this)) return false;
      return n.isFocusable;
    });
  }

  get isTextContainer() {
    return this.type.isTextBlock;
  }

  // focus can be within the node(ex: text node), excluding any child node
  get isFocusable(): boolean {
    if (this.type.isFocusable) return true;
    if (this.parents.some((n) => n.isAtom && n.isBlock)) return false;
    return (
      ((this.isTextContainer && this.isVoid) || this.type.isFocusable) && !this.isCollapseHidden
    );
  }

  // a node that does not avoid to have a focus moved in by arrow keys
  get isSelectable() {
    const nonSelectable = this.chain.find((n) => !(n.type.isInlineSelectable || n.isActive));
    // console.log(nonSelectable);

    return !nonSelectable;
  }

  get isBlockSelectable() {
    return this.isBlock && this.type.isBlockSelectable;
  }

  // if content node i.e. first child is treated as content node
  // check if parent is collapse hidden
  get isCollapseHidden() {
    if (this.isPage) return false;
    if (this.props.get(CollapseHidden)) return true;

    // only collapsed parent can hide a child node
    // if the node is detached from the tree, it can't be collapse hidden
    if (!this.parentId) return false;

    // for collapsed parent, only the first child is visible
    if (!this.isContentNode && this.parent?.isCollapsed) {
      return true;
    }
    return this.parent?.isCollapseHidden;
  }

  get isEmbedding() {
    return this.type.isEmbedding;
  }

  get isAtom(): boolean {
    return this.type.isAtom;
  }

  get isContentNode(): boolean {
    return this.index == 0;
  }

  get isCollapsed() {
    return !!this.props.get(CollapsedPath);
  }

  get children() {
    return this.content.children;
  }

  get firstChild(): Optional<Node> {
    return first(this.children);
  }

  get lastChild(): Optional<Node> {
    return last(this.children);
  }

  get root(): Optional<Node> {
    return last(this.parents);
  }

  get path(): Path {
    return reverse(this.chain.map((n) => n.linkName || n.index).slice(0, -1));
  }

  get prevSibling(): Optional<Node> {
    return this.parent?.children[this.index - 1];
  }

  get nextSibling(): Optional<Node> {
    const index = this.index;
    if (index === -1) return null;
    return this.parent?.children[index + 1];
  }

  get prevSiblings(): Node[] {
    const index = this.index;
    if (index === -1) return [];
    return this.parent?.children.slice(0, index) ?? [];
  }

  get nextSiblings(): Node[] {
    const index = this.index;
    if (index === -1) return [];

    return this.parent?.children.slice(index + 1) ?? [];
  }

  get closestBlock(): Node {
    return this.closest((n) => n.isBlock)!;
  }

  get chain(): Node[] {
    const chain: Node[] = [];
    let node: Optional<Node> = this;

    while (node) {
      chain.push(node);
      node = node.parent;
    }

    return chain;
  }

  get parents(): Node[] {
    return this.chain.slice(1);
  }

  // root node has depth zero
  get depth(): number {
    let depth = 0;
    let node: Optional<Node> = this;
    while (node?.parent) {
      node = node.parent;
      depth += 1;
    }

    return depth;
  }

  get isEmpty(): boolean {
    if (this.isInlineAtom) return false;
    if (this.isInline) return !this.textContent;
    return this.children.every((n) => n.isEmpty);
  }

  get isVoid(): boolean {
    return this.content.size === 0;
  }

  get isInlineAtom() {
    return this.isAtom && this.isInline;
  }

  get isBlockAtom() {
    return this.isBlock && this.isAtom;
  }

  // TODO: user IndexMapper to optimize index caching and avoid array traverse for finding index
  // use immutable btree with fractional cascading
  get index(): number {
    const parent = this.parent;
    if (!parent) {
      // console.warn('node has no parent', this.id.toString());
      return -1;
    }

    const { children = [] } = parent;
    return findIndex(children as Node[], (n, i) => {
      // console.log("indexing", i);
      return this.id.comp(n.id) === 0;
    });
  }

  get textContent(): string {
    if (this.isInlineAtom) {
      return this.props.get(AtomContentPath) ?? "";
    }

    return this.content.textContent;
  }

  get isRoot(): boolean {
    return this.id.eq(NodeId.ROOT);
  }

  get isPage(): boolean {
    return this.type.isPage;
  }

  get isInline(): boolean {
    return this.type.isInline;
  }

  get isLeaf() {
    return this.children.length === 0;
  }

  get isContainer(): boolean {
    return this.type.isBlock && !this.type.isTextBlock;
  }

  get isBlock(): boolean {
    return this.type.isBlock;
  }

  get isIsolate() {
    return this.type.isIsolate;
  }

  get isCollapsible() {
    return this.type.isCollapsible;
  }

  get isSandbox() {
    return this.type.isSandbox;
  }

  get groups(): readonly string[] {
    return this.type.groupsNames;
  }

  get isText(): boolean {
    return this.type.isText;
  }

  get childrenIds() {
    return this.children.map((n) => n.id);
  }

  get linkedProps(): Optional<Node> {
    return this.links["props"];
  }

  linked(name: string): Optional<Node> {
    return this.links[name];
  }

  nodeId(): NodeId {
    return this.id;
  }

  // return a child node at given path
  atPath(path: Path): Optional<Node> {
    let node: Optional<Node> = this;
    for (let i = 0, len = path.length; i < len && node; i++) {
      node = node.child(path[i]);
    }

    return node;
  }

  ancestor(parent: Node): boolean {
    return this.parents.includes(parent);
  }

  // @mutates
  setParentId(parentId: Optional<NodeId>): Node {
    this.content.setParentId(parentId);

    return this;
  }

  setParent(parent: Optional<Node>): Node {
    this.content.setParent(parent);

    return this;
  }

  closest(fn: Predicate<Node>): Optional<Node> {
    if (fn(this)) return this;

    let current: Optional<Node> = this.parent;
    while (current) {
      if (fn(current)) return current;
      current = current.parent;
    }
  }

  // return true if `this` Node is after `other` Node
  after(other: Node): boolean {
    if (this.eq(other)) {
      return false;
    }

    const selfParents = reverse(this.chain);
    const nodeParents = reverse(other.chain);
    // console.log(selfParents.map((n) => `${n.id.key}:${n.index}`));
    // console.log(nodeParents.map((n) => `${n.id.key}:${n.index}`));

    const depth = Math.min(selfParents.length, nodeParents.length);
    for (let i = 0; i < depth; i += 1) {
      if (!selfParents[i].eq(nodeParents[i])) {
        // console.log(selfParents[i].name, nodeParents[i].name, selfParents[i].index, nodeParents[i].index);
        return selfParents[i].index > nodeParents[i].index;
      }
    }

    // console.log((selfParents.length, nodeParents.length));

    // return (selfParents.length > nodeParents.length)

    return false;
  }

  before(node: Node): boolean {
    if (this.eq(node)) {
      return false;
    }

    return !this.after(node);
  }

  child(index: number | string): Optional<Node> {
    if (typeof index === "string") {
      return this.links[index];
    }
    return this.children[index];
  }

  commonNode(node: Node): Node {
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

  comply(fn: Predicate<Node>): boolean {
    return false;
  }

  all(fn: With<Node>): void {
    this.preorder((n) => {
      fn(n);
      return false;
    });
  }

  filterAll(fn: Predicate<Node>) {
    const nodes: Node[] = [];
    this.preorder((n) => {
      if (fn(n)) {
        nodes.push(n);
      }
      return false;
    });

    return nodes;
  }

  each(fn: With<Node>, opts: Partial<TraverseOptions> = {}): void {
    const { direction = "forward" } = opts;
    const { children } = this;
    if (direction === "forward") {
      for (let i = 0; i < children.length; i++) {
        fn(children[i]);
      }
    } else {
      for (let i = children.length - 1; i >= 0; i--) {
        fn(children[i]);
      }
    }
  }

  find(fn: Predicate<Node>, opts?: Partial<TraverseOptions>): Optional<Node> {
    let found: Optional<Node> = null;
    opts = merge({ order: "pre", direction: "forward", skip: noop }, opts);
    // eslint-disable-next-line no-return-assign
    const collect: Predicate<Node> = (node) => !!(fn(node) && (found = node));

    opts.order === "pre" ? this.preorder(collect, opts) : this.postorder(collect, opts);
    return found;
  }

  // NOTE: the parent chain is not searched for the next node
  prev(
    fn: Predicate<Node> = yes,
    opts: Partial<TraverseOptions> = {},
    gotoParent = true,
  ): Optional<Node> {
    const options = merge(
      {
        order: "post",
        direction: "backward",
        skip: noop,
        parent: false,
        boundary: no,
      },
      opts,
    ) as TraverseOptions;
    // if (options.skip(this)) return

    const sibling = this.prevSibling;
    let found: Optional<Node> = null;
    const collect: Predicate<Node> = (node) => !!(fn(node) && (found = node));

    // check in sibling tree
    if (sibling && !options.skip(sibling)) {
      options.order == "pre"
        ? sibling?.preorder(collect, options)
        : sibling?.postorder(collect, options);
    }
    if (found) return found;

    // pass the search role to prev sibling
    found = sibling?.prev(fn, options, false);
    if (found) return found;

    // no siblings have the target, maybe we want to go above and beyond
    if (!gotoParent || !this.parent || options.boundary(this.parent)) {
      return null;
    }

    // check if parent is the target
    if (options.parent && fn(this.parent)) return this.parent;

    // pass the search role to the parent
    return this.parent.prev(fn, options, gotoParent);
  }

  // NOTE: the parent chain is not searched for the next node
  // check if next siblings' tree can fulfill predicate
  // otherwise try parent next
  next(
    fn: Predicate<Node> = yes,
    opts: Partial<TraverseOptions> = {},
    gotoParent = true,
  ): Optional<Node> {
    const options = merge(
      {
        order: "post",
        direction: "forward",
        skip: noop,
        parent: false,
        boundary: no,
      },
      opts,
    ) as TraverseOptions;

    const sibling = this.nextSibling;
    let found: Optional<Node> = null;
    const collect: Predicate<Node> = (node) => !!(fn(node) && (found = node));
    if (sibling && !options.skip(sibling)) {
      options.order == "pre"
        ? sibling?.preorder(collect, options)
        : sibling?.postorder(collect, options);
    }

    if (found) return found;

    // pass the search role to next sibling
    found = sibling?.next(fn, options, false);
    if (found) return found;

    // no siblings have the target, maybe we want to go above and beyond
    if (!gotoParent || !this.parent || options.boundary(this.parent)) return null;

    // check if parent is the target
    if (options.parent && fn(this.parent)) return this.parent;

    // pass the search role to the parent
    return this.parent.next(fn, options, gotoParent);
  }

  // start walking from the node itself
  // walk preorder, traverse order: node -> children -> ...
  walk(fn: Predicate<Node> = yes, opts: Partial<TraverseOptions> = {}): boolean {
    const { order = "pre", direction = "forward" } = opts;
    const done = order == "pre" ? this.preorder(fn, opts) : this.postorder(fn, opts);

    // without the () brackets this will be wrong
    return done || (direction === "forward" ? !!this.next(fn, opts) : !!this.prev(fn, opts));
  }

  // fn should return true if the target node was found
  preorder(fn: Predicate<Node> = yes, opts: Partial<TraverseOptions> = {}): boolean {
    const { direction = "forward", skip = no } = opts;
    if (skip(this)) return false;

    const { children } = this;
    return direction === "forward"
      ? fn(this) || children.some((n) => n.preorder(fn, opts))
      : fn(this) ||
          children
            .slice()
            .reverse()
            .some((ch) => ch.preorder(fn, opts));
  }

  postorder(fn: Predicate<Node>, opts: Partial<TraverseOptions> = {}): boolean {
    const { direction = "forward", skip = no } = opts;
    if (skip(this)) return false;

    const { children } = this;
    return direction === "forward"
      ? children.some((n) => n.postorder(fn, opts)) || fn(this)
      : children
          .slice()
          .reverse()
          .some((ch) => ch.postorder(fn, opts)) || fn(this);
  }

  descendants(fn: Predicate<Node> = yes, opts?: TraverseOptions): Node[] {
    const nodes: Node[] = [];
    const collect: Predicate<Node> = (node) => {
      if (fn(node)) {
        nodes.push(node);
      }

      return false;
    };

    this.each((child) => child.preorder((node) => collect(node), opts));
    return nodes;
  }

  setLinkName(name: string) {
    this.content.setLinkName(name);
    return this;
  }

  // @mutates
  addLink(name: string, node: Node) {
    node.setParent(this).setParentId(this.id);
    node.setLinkName(name);
    this.content.addLink(name, node);
  }

  // @mutates
  removeLink(name: string) {
    this.content.removeLink(name);
  }

  // @mutates
  insert(node: Node, index: number) {
    if (node.id.eq(this.id)) {
      throw new Error("cannot insert node to itself");
    }

    const child = node.setParent(this).setParentId(this.id);
    this.content.insert(child, index);
  }

  insertText(text: string, offset: number) {
    this.content.insertText(text, offset);
  }

  removeText(offset: number, length: number) {
    this.content.removeText(offset, length);
  }

  // @mutates
  remove(node: Node) {
    if (node.id.eq(this.id)) {
      throw new Error("cannot remove node from itself");
    }
    this.content.remove(node);
  }

  replace(index: number, replacement: Node) {
    this.content.replace(index, replacement);
  }

  updateContent(content: Node[] | string) {
    // console.log('updateContent', this.id.toString(), this.textContent, this.children.map(n => n.textContent));
    if (isArray(content)) {
      const nodes = content.map((n) => {
        if (n.isFrozen) {
          throw new Error("cannot update frozen node");
        }
        return n.setParent(this).setParentId(this.id);
      });
      this.content.updateContent(nodes);
    } else {
      this.content.updateContent(content);
    }
  }

  // @mutates
  changeType(type: NodeType) {
    this.content.changeType(type);
  }

  // @mutates
  updateProps(props: NodePropsJson) {
    this.content.updateProps(props);

    return this;
  }

  // unfreeze unfreezes the nodes in the path
  // this is useful when we want to mutate the node and its descendants multiple times without creating new nodes
  // one way to think about this is that we are unfreezing the node and its descendants to a temporary state using a path laser
  unfreeze(path: Path, map: NodeMap): MutableNode {
    return this;
  }

  compatible(other: Node) {
    throw new Error("not implemented");
  }

  // only check by id
  // not a deep check
  eq(node: Node): boolean {
    return this.id.eq(node.id);
  }

  eqContent(node: Node): boolean {
    if (this.name !== node.name) return false;
    if (this.children.length !== node.children.length) return false;
    if (this.children.length === 0) {
      return this.textContent === node.textContent;
    }
    return this.children.every((n, i) => n.eqContent(node.children[i]));
  }

  toString(): string {
    return classString(this)({
      id: this.id,
      name: this.name,
    });
  }

  toJSON(option?: NodeJSONOption) {
    const { id, type, children, textContent, props } = this;
    const links = entries(this.links).reduce(
      (acc, [k, v]) => {
        acc[k] = v.toJSON(option);
        return acc;
      },
      {} as Record<string, string>,
    );

    const propsCone = option?.props?.noLocal ? props.clone().delete("local") : props.clone();

    if (this.isText) {
      return {
        id: id.toString(),
        name: type.name,
        text: textContent,
        links,
        props: props.toJSON(),
      };
    }

    return {
      id: id.toString(),
      name: type.name,
      children: children.map((n) => n.toJSON(option)),
      links,
      props: propsCone.toJSON(),
    };
  }

  // creates a mutable copy of the node
  clone(map: (node: NodeContentData) => NodeContentData = identity): Node {
    throw new Error("not implemented");
  }

  map(mapper: (data: NodeContentData) => Optional<NodeContentData>): Node {
    throw new Error("not implemented");
  }

  // @mutates
  freeze(fn: With<Node>): Node {
    throw new Error("not implemented");
  }

  isNode(): this is Node {
    return true;
  }
}

export function NodeComparator(a: Node, b: Node): number {
  return b.id.comp(a.id);
}
