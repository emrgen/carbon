import { cloneDeep, findIndex, first, last, merge, noop, reverse } from 'lodash';
import { Fragment } from './Fragment';

import { Optional, Predicate, With } from '@emrgen/types';
import { EventEmitter } from 'events';
import { takeUpto } from '../utils/array';
import { ContentMatch } from './ContentMatch';
import { classString } from './Logger';
import { Mark, MarkSet } from './Mark';
import { NodeAttrs } from './NodeAttrs';
import { BlockContent, InlineContent, NodeContent } from './NodeContent';
import { NodeData } from './NodeData';
import { NodeId } from './NodeId';
import { NodeType } from './NodeType';
import { NodeJSON, yes } from './types';

export type TraverseOptions = {
	order: 'pre' | 'post';
	direction: 'forward' | 'backward';
	skip: Predicate<Node>;
}

export interface NodeCreateProps {
	id: NodeId;
	type: NodeType;
	content: NodeContent;

	marks?: MarkSet;
	data?: NodeData;
	attrs?: NodeAttrs;

	renderVersion?: number;
	updateVersion?: number;
}

let key = 0
const nextKey = () => key++

export type NodeView = Node;

export class Node extends EventEmitter {
	// used for testing/debugging
	test_key: number;

	id: NodeId;
	type: NodeType;
	content: NodeContent;
	parent: Optional<Node>;

	marks: MarkSet;
	attrs: NodeAttrs;
	data: NodeData;

	renderVersion = 0;
	updateVersion = 0;

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

	constructor(object: NodeCreateProps) {
		super();
		const {
			id,
			type,
			content,
			marks = MarkSet.empty(),
			attrs = {},
			data = {},
			renderVersion = 0,
			updateVersion = 0
		} = object;
		this.test_key = nextKey()
		this.id = id;
		this.type = type;
		this.content = content.withParent(this)
		this.marks = marks;
		this.attrs = new NodeAttrs(merge(cloneDeep(type.attrs), attrs));
		this.data = new NodeData();

		this.renderVersion = renderVersion;
		this.updateVersion = updateVersion;
	}

	syncChildren() { }
	syncAttrs() { }
	syncData() { }
	syncMarks() { }

	get key() {
		return this.id.id
	}

	get version() {
		const { id, updateVersion } = this;
		return `${id.id}(${updateVersion})`;
	}

	get placeholder() {
		return this.type.attrs.html.placeholder
	}

	get canSplit() {
		return this.type.canSplit
	}

	// nodes that are not allowed to merge with any other node
	get canMerge() {
		return !this.type.isIsolating && !this.isAtom;
	}

	get isDirty() {
		return this.renderVersion < this.updateVersion
	}

	get name() {
		return this.type.name;
	}

	get isActive() {
		return this.data.state.active;
	}

	get isSelected() {
		return this.data.state.selected;
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
		if (this.isInlineAtom) return this.attrs.node?.size ?? 1
		// if (this.isEmpty && this.isInline) return 1
		// if (this.isEmpty || this.isInlineAtom) return 1;
		// if (this.isBlockAtom) return 0;
		if (this.isText) return this.textContent.length;

		const focusSize = this.children.reduce((fs, n) => {
			return fs + n.focusSize;
		}, 0);

		return focusSize;
	}

	// focus can be within the node, including any descendants node
	get hasFocusable() {
		if (!this.isBlock) return false;
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
		return ((this.isTextBlock && this.isEmpty) || !!this.type.isFocusable) && !this.isCollapseHidden;
	}

	// a node that does not avoids to have a focus moved in by arrow keys
	get isSelectable() {
		const nonSelectable = this.chain.find(n => !(n.type.isSelectable || n.isActive));
		// console.log(nonSelectable);

		return !nonSelectable
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

	get isProxy(): boolean {
		return false
	}

	get isCollapsed() {
		return !!this.attrs.node.collapsed
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
		return this.content.textContent
	}

	get isRoot(): boolean {
		return !this.parent;
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
		console.log(fragment)
		return this.parent?.type.contentMatch.matchFragment(fragment)
	}
	//
	setParent(parent: Optional<Node>) {
		this.parent = parent;
	}

	closest(fn: Predicate<Node>): Optional<Node> {
		return this.chain.find(fn);
	}

	sizeOf(fn: Predicate<Node>): number {
		return this.descendants(fn).reduce((s, n) => s + n.size, 0);
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

	childAfter(pos: number): void { }

	childBefore(pos: number): void { }

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

	cut(from: number, to: number): Node[] {
		// const nodes = this.slice(from, to);

		// this.content = [
		// 	...this.children.slice(0, from),
		// 	...this.children.slice(to),
		// ];

		// if (isString(nodes)) {
		// 	return [];
		// }

		return [];
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

	find(fn: Predicate<Node>, opts?: TraverseOptions): Optional<Node> {
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
		const { direction = 'forward' } = opts;
		const { children } = this;

		return direction === 'forward'
			? fn(this) || children.some(n => n.preorder(fn, opts))
			: fn(this) || children.slice().reverse().some(ch => ch.preorder(fn, opts))
	}

	postorder(fn: Predicate<Node>, opts: Partial<TraverseOptions> = {}): boolean {
		const { direction = 'forward' } = opts;
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

	replace(node: Node, fragment: Fragment) {
		this.content = this.content.replace(node, fragment).withParent(this)
		this.markUpdated();
	}

	// @mutates
	append(fragment: Fragment) {
		this.content = this.content.append(fragment).withParent(this);
		this.markUpdated();
	}

	// @mutates
	insertBefore(fragment: Fragment, node: Node) {
		this.content = this.content.insertBefore(fragment, node).withParent(this)
		this.markUpdated();
	}

	// @mutates
	insertAfter(fragment: Fragment, node: Node) {
		this.content = this.content.insertAfter(fragment, node).withParent(this)
		this.markUpdated();
	}

	// @mutates
	remove(node: Node, start?: number, end?: number) {
		this.content.remove(node, start, end);
		this.markUpdated();
		// console.log('removed', this.root?.version, this.root?.name, this.root?.test_key, this.root?.updatedChildren)
	}

	updateText(text: string) {
		this.content.updateText(text)
		this.markUpdated()
	}

	updateContent(content: NodeContent) {
		this.content = content.withParent(this);
		this.markUpdated();
	}

	// @mutates
	changeType(type: NodeType) {
		this.type = type;
		this.markUpdated();
	}

	// @mutates
	updateProps(props: Record<string, any>) {
		this.attrs.update(props);
		this.markUpdated();
	}

	
	// @mutates
	updateData(data: Record<string, any>) {
		this.data.update(data);
		this.markUpdated()
	}

	// @mutates
	addMark(mark: Mark, start: number, end: number) {
		// this.marks?.add(mark);
		// this.markUpdated();
	}

	// @mutates
	removeMark(mark: Mark, start: number, end: number) {
		// this.markUpdated();
		// this.marks?.remove(mark);
	}

	markUpdated() {
		this.chain.forEach(n => {
			n.updateVersion++
		});
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

		return {
			id: id.toString(),
			name: type.name,
			...content.toJSON(),
		}
	}

	viewJSON() {
		const { id, type, data, attrs, textContent } = this;
		return {
			id,
			type,
			data,
			attrs,
			children: this.children.map(n => n.viewJSON()),
			text: this.isText ? this.textContent : ''
		}
	}

	clone() {
		const { id, type, content, attrs, data, marks, renderVersion, updateVersion } = this;
		const cloned = Node.create({
			id,
			type,
			content: content.clone(),
			attrs,
			data,
			marks,
			renderVersion,
			updateVersion
		});

		cloned.setParent(this.parent)

		return cloned;
	}

	// view act as a immutable node tree reference
	view(container: Node[] = []): NodeView {
		return this
	}

}

export function NodeComparator(a: Node, b: Node): number {
	return b.id.comp(a.id)
}
