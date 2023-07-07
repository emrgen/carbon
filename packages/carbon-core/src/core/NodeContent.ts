import { findIndex, flatten } from 'lodash';

import { Node } from './Node';

export interface NodeContent {
	size: number;
	children: Node[];
	textContent: string;

	withParent(parent: Node): NodeContent;

	replace(node: Node, by: Node): NodeContent;
	append(node: Node[]): NodeContent;
	insert(node: Node, offset: number): NodeContent;
	insertBefore(before: Node, node: Node[]): NodeContent;
	insertAfter(after: Node, node: Node[]): NodeContent;
	remove(node: Node): boolean;

	updateText(text: string): void;

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

	insert(node: Node, offset: number): NodeContent {
		return this
	}

	append(nodes: Node[]): NodeContent {
		return BlockContent.create([...this.nodes, ...nodes])
	}

	replace(node: Node, by: Node): NodeContent {
		const nodes = this.nodes.map(n => {
			return n.eq(node) ? by : n;
		});

		return BlockContent.create(nodes);
	}

	insertBefore(before: Node, nodes: Node[]): NodeContent {
		const {children} = this
		const index = this.indexOf(before);
		const content = flatten([children.slice(0, index), nodes, children.slice(index)]);
		return BlockContent.create(content)
	}

	insertAfter(after: Node, nodes: Node[]): NodeContent {
		const { children } = this;
		const index = this.indexOf(after);
		const content = flatten([children.slice(0, index + 1), nodes, children.slice(index+1)]);
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

	updateText(text: string) {
		throw new Error("Not implemented");
	}

	clone(): BlockContent {
		return BlockContent.create(this.nodes.map(n => n.clone()));
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

	append(nodes: Node[]): NodeContent {
		throw new Error("Not implemented");
	}

	replace(node: Node, by: Node): NodeContent {
		throw new Error("Not implemented");
	}

	insert(node: Node, offset: number): NodeContent {
		throw new Error("Not implemented");
	}

	insertBefore(before: Node, nodes: Node[]): NodeContent {
		throw new Error("Not implemented");
	}

	insertAfter(after: Node, nodes: Node[]): NodeContent {
		throw new Error("Not implemented");
	}

	remove(node: Node): boolean {
		return false
	}

	split(offset: number): [NodeContent, NodeContent] {
		return [this, this]
	}

	updateText(text: string) {
		this.text = text;
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

