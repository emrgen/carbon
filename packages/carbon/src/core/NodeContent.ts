import { findIndex, flatten } from 'lodash';

import { Fragment } from './Fragment';
import { Node, NodeProps } from './Node';

export interface NodeContent {
	size: number;
	children: Node[];
	textContent: string;

	withParent(parent: Node): NodeContent;

	insert(fragment: Fragment, offset: number): NodeContent;
	insertBefore(fragment: Fragment, node: Node): NodeContent;
	insertAfter(fragment: Fragment, node: Node): NodeContent;
	remove(node: Node, start?: number, end?: number): boolean;

	view(container: Node[]): NodeContent;
	clone(): NodeContent;
	toJSON(): any;
}

interface BlockContentProps {
	nodes: Node[]
}

export class BlockContent implements NodeContent {
	nodes: Node[]

	get children(): Node[] {
		return this.nodes;
	}

	static create(nodes: Node[]) {
		return new BlockContent({ nodes });
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

	withParent(parent: Node): NodeContent {
		this.nodes.forEach(n => n.setParent(parent));
		return this;
	}

	indexOf(node: Node) {
		return findIndex(this.nodes, n => {
			return node.id.comp(n.id) === 0
		});
	}

	insert(fragment: Fragment, offset: number): NodeContent {
		throw new Error("");
	}

	insertBefore(fragment: Fragment, node: Node): NodeContent {
		const {nodes} = this
		const index = this.indexOf(node);
		const content = flatten([nodes.slice(0, index), fragment.nodes, nodes.slice(index)]);
		return BlockContent.create(content)
	}

	insertAfter(fragment: Fragment, node: Node): NodeContent {
		const { nodes } = this;
		const index = this.indexOf(node);
		const content = flatten([nodes.slice(0, index+1), fragment.nodes, nodes.slice(index+1)]);
		return BlockContent.create(content)
	}

	remove(node: Node): boolean {
		const {nodes} = this
		const found = nodes.find(n => n.eq(node));
		this.nodes = nodes.filter(n => n !== found);
		return !!found;
	}

	view(container: Node[]): NodeContent {
		return BlockContent.create(this.nodes.map(n => n.view(container)))
	}

	destroy() {}

	clone(): BlockContent {
		return BlockContent.create(this.nodes);
	}

	toJSON() {
		return {
			content: this.nodes.map(n => n.toJSON())
		}
	}
}

interface TextContentProps {
	text: string
}

export class InlineContent implements  NodeContent {
	text: string

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
		return InlineContent.fromProps({text})
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
		throw new Error('Method not implemented.');
	}

	withParent(parent: Node): NodeContent {
		return this;
	}

	replace(old: Node, by: Node) {
		throw new Error("Not implemented");
	}

	insert(fragment: Fragment, offset: number): NodeContent {
		throw new Error("Not implemented");
	}

	insertBefore(fragment: Fragment, node: Node): NodeContent {
		throw new Error("Not implemented");
	}

	insertAfter(fragment: Fragment, node: Node): NodeContent {
		throw new Error("Not implemented");
	}

	remove(node: Node): boolean {
		return false
	}

	view(): NodeContent {
		return this
	}

	clone(): InlineContent {
		return InlineContent.create(this.text);
	}

	destroy() {}

	toJSON() {
		return {
			text: this.textContent
		}
	}
}

