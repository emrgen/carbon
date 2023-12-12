import { findIndex, flatten, identity } from 'lodash';

import { Node } from './Node';
import { Optional } from "@emrgen/types";
import { NodeId } from './NodeId';
import { Maps, With } from './types';

export interface NodeContent {
	size: number;
	children: Node[];
	textContent: string;

	setParentId(parentId: NodeId): NodeContent;
	setParent(parent: Node): NodeContent;
	replace(node: Node, by: Node[]): NodeContent;
	prepend(nodes: Node[]): NodeContent;
	append(nodes: Node[]): NodeContent;
	insert(node: Node, offset: number): NodeContent;
	insertBefore(before: Node, node: Node[]): NodeContent;
	insertAfter(after: Node, node: Node[]): NodeContent;
	remove(node: Node): boolean;
	tryMerge(other: NodeContent): Optional<NodeContent>;
	split(offset: number): [NodeContent, NodeContent];

	updateText(text: string): void;

	view(container: Node[]): NodeContent;
	clone(map: Maps<Node, Optional<Node>>): NodeContent;
	freeze(): NodeContent;
	toJSON(): any;
}

interface BlockContentProps {
	nodes: Node[]
}

export class BlockContent implements NodeContent {
	nodes: Node[]
	frozen: boolean = false

	get children(): Node[] {
		return this.nodes;
	}

	static empty(): BlockContent {
		return BlockContent.create([])
	}

	static create(nodes: Node | Node[]) {
		if (!Array.isArray(nodes)) {
			return new BlockContent({ nodes: [nodes] });
		} else {
			return new BlockContent({ nodes: nodes });
		}
	}

	constructor(props: BlockContentProps) {
		this.nodes = props.nodes
	}

	get size(): number {
		return this.children.length;
	}

	get textContent(): string {
		return this.children.reduce((text, node) => text + node.textContent, '');
	}

	setParentId(parentId: NodeId): NodeContent {
		// if (this.frozen) return this
		this.nodes.forEach(n => n.setParentId(parentId));
		return this;
	}

	setParent(parent: Node): NodeContent {
		if (this.frozen) return this
		this.nodes.forEach(n => {
			n.setParent(parent);
			n.setParentId(parent.id);
		});
		return this;
	}

	indexOf(node: Node) {
		return findIndex(this.nodes, n => {
			return node.id.comp(n.id) === 0
		});
	}

	insert(node: Node, offset: number): NodeContent {
		const { children } = this;
		const content = flatten([children.slice(0, offset), node, children.slice(offset)]);
		return BlockContent.create(content)
	}

	prepend(nodes: Node[]): NodeContent {
		return BlockContent.create([...nodes, ...this.nodes,])
	}

	append(nodes: Node[]): NodeContent {
		return BlockContent.create([...this.nodes, ...nodes])
	}

	replace(node: Node, by: Node[]): NodeContent {
		const nodes = flatten(this.nodes.map(n => {
			return n.eq(node) ? by : n;
		}));

		return BlockContent.create(nodes);
	}

	insertBefore(before: Node, nodes: Node[]): NodeContent {
		const { children } = this
		const index = this.indexOf(before);
		const content = flatten([children.slice(0, index), nodes, children.slice(index)]);
		return BlockContent.create(content)
	}

	insertAfter(after: Node, nodes: Node[]): NodeContent {
		const { children } = this;
		const index = this.indexOf(after);
		const content = flatten([children.slice(0, index + 1), nodes, children.slice(index + 1)]);
		return BlockContent.create(content)
	}

	remove(node: Node): boolean {
		const { nodes } = this;
		const found = nodes.find(n => n.eq(node));
		this.nodes = nodes.filter(n => !n.eq(node));
		return !!found;
	}

	tryMerge(other: NodeContent): Optional<NodeContent> {
		if (other instanceof BlockContent) {
			return BlockContent.create([...this.nodes, ...other.nodes]);
		}

		return null;
	}

	split(offset: number): [NodeContent, NodeContent] {
		const { nodes } = this;
		const left = nodes.slice(0, offset);
		const right = nodes.slice(offset);

		return [BlockContent.create(left), BlockContent.create(right)];
	}

	view(container: Node[]): NodeContent {
		return BlockContent.create(this.nodes);
	}

	destroy() { }

	updateText(text: string) {
		throw new Error("Not implemented");
	}

	freeze() {
		if (this.frozen) return this;
		this.frozen = true;
		this.nodes.forEach(n => n.freeze());
		Object.freeze(this)
		return this;
	}

	clone(map: Maps<Node, Optional<Node>> = identity): BlockContent {
		const children = this.nodes.map(n => map(n)).filter(identity) as Node[];
		return BlockContent.create(children);
	}

	toJSON() {
		return {
			children: this.nodes.map(n => n.toJSON())
		}
	}
}

interface TextContentProps {
	text: string
}

export class InlineContent implements NodeContent {
	text: string;
	frozen: boolean = false;

	get children(): Node[] {
		return []
	}

	get nodes(): Node[] {
		return []
	}

	get size(): number {
		return this.text.length
	}

	get textContent(): string {
		return this.text;
	}

	static create(text: string) {
		return InlineContent.fromProps({ text })
	}

	static fromProps(props: TextContentProps) {
		return new InlineContent(props);
	}

	constructor(props: TextContentProps) {
		this.text = props.text;
	}

	// setProps(props: TextContentProps): void {
	// 	this.text = props.text;
	// }

	destroyShallow() {
		throw new Error('Method not implemented for InlineContent');
	}

	setParentId(parentId: NodeId): NodeContent {
		return this;
	}

	setParent(parent: Node): NodeContent {
		return this;
	}

	prepend(nodes: Node[]): NodeContent {
		throw new Error("Not implemented for InlineContent");
	}

	append(nodes: Node[]): NodeContent {
		throw new Error("Not implemented for InlineContent");
	}

	replace(node: Node, by: Node[]): NodeContent {
		throw new Error("Not implemented for InlineContent");
	}

	insert(node: Node, offset: number): NodeContent {
		throw new Error("Not implemented for InlineContent");
	}

	insertBefore(before: Node, nodes: Node[]): NodeContent {
		throw new Error("Not implemented for InlineContent");
	}

	insertAfter(after: Node, nodes: Node[]): NodeContent {
		throw new Error("Not implemented for InlineContent");
	}

	remove(node: Node): boolean {
		return false
	}

	tryMerge(other: NodeContent): Optional<NodeContent> {
		if (other instanceof InlineContent) {
			return InlineContent.create(this.text + other.text);
		}

		return null;
	}

	split(offset: number): [NodeContent, NodeContent] {
		const left = InlineContent.create(this.text.slice(0, offset));
		const right = InlineContent.create(this.text.slice(offset));

		return [left, right];
	}

	updateText(text: string) {
		this.text = text;
	}

	view(): NodeContent {
		return this
	}

	freeze() {
		if (this.frozen) return this;
		this.frozen = true;
		Object.freeze(this)
		return this;
	}

	clone(): InlineContent {
		return InlineContent.create(this.text);
	}

	destroy() { }

	toJSON() {
		return {
			text: this.textContent
		}
	}
}

