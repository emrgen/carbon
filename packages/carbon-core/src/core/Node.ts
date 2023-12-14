import { cloneDeep, findIndex, first, flatten, identity, isEmpty, last, merge, noop, reverse } from "lodash";
import { Fragment } from "./Fragment";

import { Optional, Predicate, With } from "@emrgen/types";
import { takeUpto } from "../utils/array";
import { ContentMatch } from "./ContentMatch";
import { classString } from "./Logger";
import { Mark, MarkSet } from "./Mark";
import { NodeAttrs, NodeAttrsJSON } from "./NodeAttrs";
import { NodeContent } from "./NodeContent";
import { IntoNodeId, NodeId } from "./NodeId";
import { NodeType } from "./NodeType";
import { no, NodeEncoder, NodeJSON, yes } from "./types";
import { NodeState, NodeStateJSON } from "./NodeState";
import EventEmitter from "events";
import { StateScope } from "./StateScope";
import { NodeBTree } from "./BTree";
import { NodeLinks } from "./NodeLinks";

export type TraverseOptions = {
	order: 'pre' | 'post';
	direction: 'forward' | 'backward';
	gotoParent: boolean;
	skip: Predicate<Node>;
}

export interface NodeCreateProps {
	scope?: string;
	parentId?: Optional<NodeId>;
	parent?: Optional<Node>;
	id: NodeId;
	type: NodeType;
	content: NodeContent;
	linkName?: string;
	links?: NodeLinks;
	marks?: MarkSet;
	attrs?: NodeAttrs;
	state?: NodeState;
	meta?: Record<string, any>;
	version?: number;
	deleted?: boolean;
}

let key = 0
const nextKey = () => key++

export interface NodeView {
	id: NodeId;
	type: NodeType;
	version: string;
	isOpen: boolean;
	isActive: boolean;
	isSelected: boolean;
	isCollapsed: boolean;
	isFocusable: boolean;
	isSelectable: boolean;
	isBlockSelectable: boolean;
	// isCollapsedHidden: boolean;
	isVoid: boolean;
	isInline: boolean;
	isInlineAtom: boolean;
	isBlockAtom: boolean;
	isAtom: boolean;
	isText: boolean;
	isTextBlock: boolean;
	isContentNode: boolean;
	isContainerBlock: boolean;
	isEmbedding: boolean;
	isLeaf: boolean;
	isRoot: boolean;
	isDocument: boolean;
	isDirty: boolean;
	isEmpty: boolean;
	isSandbox: boolean;
	isIsolating: boolean;
	isCollapsible: boolean;
	children: NodeView[];
}

export class Node extends EventEmitter implements IntoNodeId {
	// used for testing/debugging
	test_key: number;

	scope: string;
	parentId: Optional<NodeId>;
	_parent: Optional<Node>;
	id: NodeId;
	type: NodeType;
	content: NodeContent;
	linkName: string;
	links: NodeLinks;
	marks: MarkSet;
	attrs: NodeAttrs;
	state: NodeState;

	// meta is used for storing data like version, cerate time, last update time, etc.
	meta: Record<string, any> = {};

	version: number;

	deleted = false;

	static removeId(json: NodeJSON) {
		const { id, text = '', content = [], ...rest } = json
		if (text) {
			return rest
		}

		return {
			content: content.map(n => Node.removeId(n)),
			...rest,
		}
	}

	static create(object: NodeCreateProps) {
		return new Node(object)
	}

	private constructor(object: NodeCreateProps) {
		super();
		const {
			scope = '',
			parentId,
			parent,
			id,
			type,
			content,
			links = new NodeLinks(),
			linkName = '',
			marks = MarkSet.empty(),
			attrs = NodeAttrs.from(type.attrs),
			state = NodeState.from(type.state),
			meta = {},
			version = 0,
			deleted = false,
		} = object;
		this.test_key = nextKey()
		this.scope = scope;
		this.parentId = parentId ?? parent?.id;
		this._parent = parent;
		this.id = id;
		this.type = type;
		this.content = content.setParentId(this.id).setParent(this)
		this.linkName = linkName;
		this.links = links
		this.marks = marks;

		this.attrs = attrs,
		this.state = state;
		this.meta = meta;

		this.version = version;
		this.deleted = deleted;
	}

	get parent() {
		if (!this.frozen) return this._parent;
		const map = StateScope.get(this.scope);
		if (!this.parentId) return null;
		return map.get(this.parentId!)
	}

	get key() {
		return `${this.id.id}/${this.version}`
	}

	get placeholder() {
		return this.type.attrs.html.placeholder
	}

	// nodes that are not allowed to merge with any other node
	get canMerge() {
		return !this.type.isIsolating && !this.isAtom;
	}

	get name() {
		return this.type.name;
	}

	get isLinked() {
		return !!this.linkName && this.parentId;
	}

	get isActive() {
		return this.state.activated;
	}

	get isSelected() {
		return this.state.selected;
	}

	get isOpen() {
		return this.state.opened;
	}

	get size(): number {
		if (this.isInlineAtom) return 1;
		if (this.isBlockAtom) return 0;
		return this.content.size;
	}

	// starting from left of <a> to before of </a>
	// if total focus size is needed for a block, need to add 1
	// used in Position
	// get stepSize() {
	// 	if (this.stepSizeCache) {
	// 		return this.stepSizeCache
	// 	}

	// 	if (this.isText) {
	// 		this.stepSizeCache = this.size
	// 	} else if (this.isVoid) {
	// 		this.stepSizeCache = 2
	// 	} else if (this.isAtom) {
	// 		this.stepSizeCache = 1
	// 	} else {
	// 		this.stepSizeCache = 2 + this.children.reduce((s, ch) => s + ch.stepSize, 0);
	// 	}

	// 	return this.stepSizeCache;
	// }

	// focus steps count within the node
	// start and end locations are within the node
	get focusSize(): number {
		if (this.isInlineAtom) return this.attrs.get('size') ?? 1
		// if (this.isEmpty && this.isInline) return 1
		// if (this.isEmpty || this.isInlineAtom) return 1;
		// if (this.isBlockAtom) return 0;
		if (this.isText) return this.textContent.length;

		// focus size is the sum of focus size of all children
		return this.children.reduce((fs, n) => {
			return fs + n.focusSize;
		}, 0);
	}

	// focus can be within the node, including any descendants node
	get hasFocusable() {
		if (!this.isBlock) return false;
		if (this.isAtom) return false;
		if (this.isBlock && this.isFocusable && this.isEmpty) return true;
		return this.find(n => {
			if (n.eq(this)) return false;
			return n.isFocusable
		});
	}

	get isTextBlock() {
		return this.type.isTextBlock;
	}

	// focus can be within the node(ex: text node), excluding any child node
	get isFocusable(): boolean {
		if (this.parents.some(n => n.isAtom)) return false;
		return ((this.isTextBlock && this.isEmpty) || this.type.isFocusable) && !this.isCollapseHidden;
	}

	// a node that does not avoid to have a focus moved in by arrow keys
	get isSelectable() {
		const nonSelectable = this.chain.find(n => !(n.type.isSelectable || n.isActive));
		// console.log(nonSelectable);

		return !nonSelectable
	}

	get isBlockSelectable() {
		return this.isBlock && this.type.isBlockSelectable
	}

	// if content node i.e. first child is treated as content node
	// check if parent is collapse hidden
	get isCollapseHidden() {
		if (!this.isContentNode && this.parent?.isCollapsed) {
			return true
		}
		return this.parent?.isCollapseHidden
	}

	get isEmbedding() {
		return this.type.isEmbedding
	}

	get isAtom(): boolean {
		return this.type.isAtom;
	}

	get isContentNode(): boolean {
		return this.index == 0
	}

	get isCollapsed() {
		return !!this.attrs.get('node.collapsed');
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

	get path(): number[] {
		return reverse(this.chain.map(n => n.index).slice(0, -1));
	}

	get prevSibling(): Optional<Node> {
		return this.parent?.children[this.index - 1];
	}

	get nextSibling(): Optional<Node> {
		return this.parent?.children[this.index + 1];
	}

	get prevSiblings(): Node[] {
		return this.parent?.children.slice(0, this.index) ?? [];
	}

	get nextSiblings(): Node[] {
		return this.parent?.children.slice(this.index + 1) ?? [];
	}

	get closestBlock(): Node {
		return this.closest(n => n.isBlock)!;
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
		return this.children.every(n => n.isEmpty);
	}

	get isVoid(): boolean {
		return this.content.size === 0;
	}

	get isInlineAtom() {
		return this.isAtom && this.isInline
	}

	get isBlockAtom() {
		return this.isBlock && this.isAtom
	}

	get index(): number {
		const { children = [] } = this.parent || {};
		return findIndex(children as Node[], n => {
			return this.id.comp(n.id) === 0
		});
	}

	get textContent(): string {
		return this.content.textContent;
	}

	get isRoot(): boolean {
		return !this.parent;
	}

	get isDocument(): boolean {
		return this.type.isDocument;
	}

	get isInline(): boolean {
		return this.type.isInline
	}

	get isLeaf() {
		return this.children.length === 0;
	}

	get isContainerBlock(): boolean {
		return this.type.isBlock && !this.type.isTextBlock
	}

	get isBlock(): boolean {
		return this.type.isBlock
	}

	get isIsolating() {
		return this.type.isIsolating
	}

	get isCollapsible() {
		return this.type.isCollapsible
	}

	get isSandbox() {
		return this.type.isSandbox
	}

	get groups(): readonly string[] {
		return this.type.groupsNames;
	}

	get isText(): boolean {
		return this.type.isText;
	}

	get offset(): number {
		return this.prevSiblings.reduce((offset, s) => offset + s.size, 0)
	}

	get nextMatchType(): Optional<ContentMatch> {
		const fragment = Fragment.from(takeUpto(this.parent?.children ?? [], n => n === this));
		return this.parent?.type.contentMatch.matchFragment(fragment)
	}

	intoNodeId(): NodeId {
		return this.id;
	}

	delete() {
		this.deleted = true;
	}

	undelete() {
		this.deleted = false;
	}

	// return a child node at given path
	atPath(path: number[]): Optional<Node> {
		let node: Optional<Node> = this;
		for (let i = 0, len = path.length;i < len && node;i++) {
			node = node.child(path[i])
		}

		return node;
	}

	ancestor(parent: Node): boolean {
		return this.parents.includes(parent);
	}

	// @mutates
	setParentId(parentId: Optional<NodeId>) {
		if (this.frozen) return;
		this.parentId = parentId;
	}

	setParent(parent: Node) {
		if (this.frozen) return
		this._parent = parent;
	}

	closest(fn: Predicate<Node>): Optional<Node> {
		return this.chain.find(fn);
	}

	// return true if `this` Node is after `other` Node
	after(other: Node): boolean {
		if (this.eq(other)) {
			return false;
		}

		const selfParents = reverse(this.chain);
		const nodeParents = reverse(other.chain);
		// console.log(selfParents.map(n => `${n.id.key}:${n.index}`));
		// console.log(nodeParents.map(n => `${n.id.key}:${n.index}`));

		const depth = Math.min(selfParents.length, nodeParents.length);
		for (let i = 0;i < depth;i += 1) {
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

	child(index: number): Optional<Node> {
		return this.children[index];
	}

	commonNode(node: Node): Node {
		if (this.eq(node)) {
			return this;
		}

		const selfParents = reverse(this.chain);
		const nodeParents = reverse(node.chain);

		let parent = selfParents[0];
		for (let i = 0;i < selfParents.length;i += 1) {
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

	forAll(fn: With<Node>): void {
		this.preorder(n => {
			fn(n)
			return false
		})
	}

	filterAll(fn: Predicate<Node>) {
		const nodes: Node[] = [];
		this.preorder(n => {
			if (fn(n)) {
				nodes.push(n)
			}
			return false
		})

		return nodes;
	}

	each(fn: With<Node>, opts: Partial<TraverseOptions> = {}): void {
		const { direction = 'forward' } = opts
		if (direction === 'forward') {
			this.children.forEach(c => fn(c));
		} else {
			this.children.slice().reverse().forEach(c => fn(c));
		}
	}

	find(fn: Predicate<Node>, opts?: Partial<TraverseOptions>): Optional<Node> {
		let found: Optional<Node> = null;
		opts = merge({ order: 'pre', direction: 'forward', skip: noop }, opts)
		// eslint-disable-next-line no-return-assign
		const collect: Predicate<Node> = node => !!(fn(node) && (found = node));

		opts.order === 'pre' ? this.preorder(collect, opts) : this.postorder(collect, opts);
		return found;
	}

	// NOTE: the parent chain is not searched for the next node
	prev(fn: Predicate<Node> = yes, opts: Partial<TraverseOptions> = {}, gotoParent = true): Optional<Node> {
		const options = merge({ order: 'post', direction: 'backward', skip: noop }, opts) as TraverseOptions;
		// if (options.skip(this)) return

		const sibling = this.prevSibling;
		let found: Optional<Node> = null;
		const collect: Predicate<Node> = node => !!(fn(node) && (found = node));
		if (sibling && !options.skip(sibling)) {
			(options.order == 'pre' ? sibling?.preorder(collect, options) : sibling?.postorder(collect, options))
		}

		return (
			found
			|| sibling?.prev(fn, options, false)
			|| (gotoParent ? this.parent?.prev(fn, options, gotoParent) : null)
		);
	}

	// NOTE: the parent chain is not searched for the next node
	// check if next siblings' tree can fulfill predicate
	// otherwise try parent next
	next(fn: Predicate<Node> = yes, opts: Partial<TraverseOptions> = {}, gotoParent = true): Optional<Node> {
		const options = merge({ order: 'post', direction: 'forward', skip: noop }, opts) as TraverseOptions;
		// if (options.skip(this)) return

		const sibling = this.nextSibling;
		let found: Optional<Node> = null;
		const collect: Predicate<Node> = node => !!(fn(node) && (found = node));
		if (sibling && !options.skip(sibling)) {
			(options.order == 'pre' ? sibling?.preorder(collect, options) : sibling?.postorder(collect, options))
		}

		return (
			found
			|| sibling?.next(fn, options, false)
			// || (lastChild && this.parent && fn(this.parent) ? this.parent : null)
			|| (gotoParent ? this.parent?.next(fn, options, gotoParent) : null)
		);
	}

	// walk preorder, traverse order: node -> children -> ...
	walk(fn: Predicate<Node> = yes, opts: Partial<TraverseOptions> = {}): boolean {
		const { order = 'pre', direction = 'forward' } = opts;
		const done = order == 'pre' ? this.preorder(fn, opts) : this.postorder(fn, opts);

		// without the () brackets this will be wrong
		return done || (direction === 'forward' ? !!this.next(fn, opts) : !!this.prev(fn, opts));
	}

	preorder(fn: Predicate<Node> = yes, opts: Partial<TraverseOptions> = {}): boolean {
		const { direction = 'forward', skip = no } = opts;
		if (skip(this)) return false

		const { children } = this;
		return direction === 'forward'
			? fn(this) || children.some(n => n.preorder(fn, opts))
			: fn(this) || children.slice().reverse().some(ch => ch.preorder(fn, opts))
	}

	postorder(fn: Predicate<Node>, opts: Partial<TraverseOptions> = {}): boolean {
		const { direction = 'forward', skip = no } = opts;
		if (skip(this)) return false

		const { children } = this;
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

	// @mutates
	replace(node: Node, by: Node | Node[]) {
		this.content = this.content.replace(node, flatten([by])).setParentId(this.id)
	}

	link(name: string, node: Node) {
		if (this.frozen) {
			throw Error('cannot link immutable node:' + node.id.toString())
		}

		this.links.link(name, node)
	}

	unlink(name: string): Optional<Node> {
		if (this.frozen) {
			throw Error('cannot unlink immutable, link:' + name)
		}
		return this.links.unlink(name)
	}

	// @mutates
	prepend(node: Node) {
		if (node.frozen) {
			throw Error('cannot insert immutable node:' + node.id.toString())
		}
		node.parentId = this.id;
		this.content = this.content.prepend([node]);
	}

	// @mutates
	append(node: Node) {
		if (node.frozen) {
			throw Error('cannot insert immutable node:' + node.id.toString())
		}
		node.parentId = this.id;
		this.content = this.content.append([node]);
	}

	// @mutates
	insertBefore(before: Node, node: Node) {
		if (node.frozen) {
			throw Error('cannot insert immutable node:' + node.id.toString())
		}
		node.parentId = this.id;
		this.content = this.content.insertBefore(before, [node]);
	}

	// @mutates
	insertAfter(after: Node, node: Node) {
		if (node.frozen) {
			throw Error('cannot insert immutable node:' + node.id.toString())
		}
		node.parentId = this.id;
		this.content = this.content.insertAfter(after, [node]);
	}

	// @mutates
	remove(node: Node) {
		this.content.remove(node);
		node.parentId = null;
		// console.log('removed', this.root?.version, this.root?.name, this.root?.test_key, this.root?.updatedChildren)
	}

	updateText(text: string) {
		this.content.updateText(text)
	}

	updateContent(content: NodeContent) {
		this.content = content.setParentId(this.id);
	}

	// @mutates
	changeType(type: NodeType) {
		if (this.frozen) {
			throw Error('cannot change type of immutable node:' + this.id.toString())
		}

		this.type = type;
		this.attrs = new NodeAttrs(type.attrs);
		this.state = new NodeState(type.state);
	}

	// @mutates
	updateAttrs(props: NodeAttrsJSON) {
		console.log('updateAttrs', props);
		this.attrs = this.attrs.update(props);
		console.log(this.attrs);
	}

	// @mutates
	updateState(state: NodeStateJSON) {
		this.state = this.state.update(state);
	}

	// @mutates
	addMark(mark: Mark) {
		this.marks.add(mark);
	}

	// @mutates
	tryMerge(other: Node): Optional<Node> {
		// TODO: use more general merge compatibility check
		if (this.type !== other.type) return null;
		if (!this.marks.eq(other.marks)) return null;

		const merged = this.content.tryMerge(other.content);

		if (!merged) return null;

		this.updateContent(merged);
	}

	compatible(other: Node) {
		throw new Error('not implemented')
	}

	// @mutates
	removeMark(mark: Mark) {
		this.marks.remove(mark);
	}


	eq(node: Node): boolean {
		return this.id.eq(node.id);
	}

	toString(): string {
		return classString(this)({
			id: this.id,
			name: this.name,
		})
	}

	toJSON() {
		const { id, type, content } = this;
		const json: any = ({
			id: id.toString(),
			name: type.name,
		});

		const attrs = this.attrs.toJSON();
		const state = this.state.toJSON();
		if (!isEmpty(attrs)) {
			json.attrs = attrs;
		}

		if (!isEmpty(state)) {
			json.state = state;
		}

		return {
			...json,
			...content.toJSON()
		}
	}

	encode<T>(encoder: NodeEncoder<T>) {
		return encoder.encode(this);
	}

	viewJSON() {
		const { id, type, state, attrs, textContent } = this;
		return {
			id,
			type,
			state,
			attrs,
			children: this.children.map(n => n.viewJSON()),
			text: this.isText ? this.textContent : ''
		}
	}

	// creates a mutable copy of the node
	clone(map: (node: Node) => Optional<Node> = identity): Node {
		const { scope, parentId, id, type, content, links, attrs, state, marks, version } = this;
		// const links = new Map(this.links);

		const cloned = Node.create({
			scope,
			parentId,
			id,
			type,
			content: content.clone(map).setParent(this).setParentId(this.id),
			links,
			attrs,
			state,
			marks,
			version: version + 1,
		});

		return cloned;
	}

	// view act as a immutable node tree reference
	// view(container: Node[] = []): NodeView {
	// 	return this
	// }

	frozen = false
	// @mutates
	freeze() {
		if(this.frozen) return this
		this.frozen = true

		// unlink from parent when freezing
		this._parent = null;
		this.content.freeze();

		Object.freeze(this)
		return this;
	}
}

export function NodeComparator(a: Node, b: Node): number {
	return b.id.comp(a.id)
}
