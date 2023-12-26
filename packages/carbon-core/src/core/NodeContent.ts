import { findIndex, flatten, identity } from 'lodash';

import { Node } from './Node';
import { Optional } from "@emrgen/types";
import { NodeId } from './NodeId';
import { Maps, With } from './types';

export interface NodeContent {
	size: number;
	children: Node[];
	textContent: string;
	isEmpty: boolean;
	version: number;

	setParentId(parentId: NodeId): NodeContent;
	setParent(parent: Node): NodeContent;
	insert(node: Node, offset: number): NodeContent;
	remove(node: Node): boolean;
	split(offset: number): [NodeContent, NodeContent];

	insertText(text: string, offset: number): void;
  removeText(offset: number, length: number): void;

	view(container: Node[]): NodeContent;
	clone(map: Maps<Node, Optional<Node>>): NodeContent;
	freeze(): NodeContent;
	toJSON(): any;
}

export interface BlockContentProps {
	nodes: Node[]
}

export class BlockContent implements NodeContent {
	nodes: Node[];
  text: string;
	frozen: boolean = false

	version: number = 0;

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
    this.text = '';
	}

	get isEmpty() {
		return this.size == 0 || this.children.every(n => n.isEmpty)
	}

	get size(): number {
		return this.children.length;
	}

	get textContent(): string {
    if (this.text) {
      return this.text
    }

		return this.children.reduce((text, node) => text + node.textContent, '');
	}

  insertText(text: string, offset: number): void {
    this.text = this.text.slice(0, offset) + text + this.text.slice(offset);
    this.version += 1;
  }

  removeText(offset: number, length: number): void {
    this.text = this.text.slice(0, offset) + this.text.slice(offset + length);
    this.version += 1;
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
		this.nodes = [...children.slice(0, offset), node, ...children.slice(offset)];
		return this;
	}

	prepend(nodes: Node[]): NodeContent {
		this.nodes = [...nodes, ...this.nodes];
		return this
	}

	append(nodes: Node[]): NodeContent {
		this.nodes = [...this.nodes, ...nodes];
		return this
	}

	replace(node: Node, by: Node[]): NodeContent {
		this.nodes = flatten(this.nodes.map(n => {
			return n.eq(node) ? by : n;
		}));

		return this
	}

	insertBefore(before: Node, nodes: Node[]): NodeContent {
		const { children } = this
		const index = this.indexOf(before);
		this.nodes = flatten([children.slice(0, index), nodes, children.slice(index)]);
		return this
	}

	insertAfter(after: Node, nodes: Node[]): NodeContent {
		const { children } = this;
		const index = this.indexOf(after);
		this.nodes = flatten([children.slice(0, index + 1), nodes, children.slice(index + 1)]);
		return this;
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

export interface TextContentProps {
	text: string
}

export class InlineContent implements NodeContent {
	text: string;
	frozen: boolean = false;
	version: number = 0;

	get isEmpty() {
		return !this.text
	}

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

	setParentId(parentId: NodeId): NodeContent {
		return this;
	}

	setParent(parent: Node): NodeContent {
		return this;
	}

	insert(node: Node, offset: number): NodeContent {
		throw new Error("Not implemented for InlineContent");
	}

	remove(node: Node): boolean {
		return false
	}

	split(offset: number): [NodeContent, NodeContent] {
		const left = InlineContent.create(this.text.slice(0, offset));
		const right = InlineContent.create(this.text.slice(offset));

		return [left, right];
	}

	insertText(text: string) {
		this.text = text;
		this.version += 1;
	}

  removeText(offset: number, length: number) {
    this.text = this.text.slice(0, offset) + this.text.slice(offset + length);
    this.version += 1;
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

