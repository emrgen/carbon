import { Optional } from '@emrgen/types';
import { each, isArray,  merge } from 'lodash';
import { ContentMatch } from './ContentMatch';
import { Fragment } from './Fragment';
import { MarkSet } from './Mark';
import { Node } from './Node';
import { NodeSpec, Schema } from './Schema';
import { HTMLAttrs,  NodeName } from './types';
import { NodeAttrsJSON } from "./NodeAttrs";
import { NodeStateJSON } from "./NodeState";
import { InitNodeJSON } from "@emrgen/carbon-core";

const specGroups = (name: string, spec: NodeSpec) => {
	const groups = new Set(spec.group ? spec.group.split(" ") : []);
	const isBlock = !(spec.inline || name == "text");
	if (isBlock) {
		groups.add('block');
	} else {
		groups.add('inline');
	}
	return Array.from(groups);
}

const IDENTITY_NODE_SPEC: NodeSpec = {
	attrs: {},
	group: '',
	content: '',
	marks: '',
	inline: false,
}

interface DefaultParams {
	attrs?: NodeAttrsJSON,
	state?: NodeStateJSON,
}

export class NodeType {
	groupsNames: readonly string[];

	attrs: {
		node: Record<string, any>;
		html: HTMLAttrs;
	};

	state: Record<string, any>;

	/// True if this node type has inline content.
	inlineContent!: boolean
	/// True if this is a block type
	isBlock: boolean
	/// True if this is the text node type.
	isText: boolean

	contentMatch!: ContentMatch;

	markSet: MarkSet;

	contents: NodeName[];

	static IDENTITY = new NodeType('identity', {} as Schema, IDENTITY_NODE_SPEC);

	static compile(specs: Record<NodeName, NodeSpec>, schema: Schema) {
		const nodes = {};
		each(specs, (spec, name) => {
			// console.log(merge(defaultSpec, spec));
			nodes[name] = new NodeType(name, schema, spec);
		});
		return nodes;
	}

	// name: name of the node
	// schema: back reference to editor schema
	// spec: spec of the NodeType
	constructor(readonly name: NodeName, readonly schema: Schema, readonly spec: NodeSpec) {
		this.groupsNames = specGroups(name, spec);
		this.attrs = merge({ node: {}, html: {} }, spec.attrs ?? {});
		this.state = spec.state ?? {};

		this.isBlock = !(spec.inline || name == "text")
		this.isText = name == "text";
		this.markSet = new MarkSet();
		this.contents = [];
	}

	computeContents() {
		const { nodes } = this.schema;
		const nodeGroups: Record<string, Set<NodeName>> = {};
		// generate groupName to nodeName map
		// for a nodeName create a temporary group
		each(nodes, (type, name) => {
			if (!type.isDraggable) return
			nodeGroups[name] = new Set([name]);
			each(type.groups, groupName => {
				nodeGroups[groupName] = nodeGroups[groupName] ?? new Set();
				nodeGroups[groupName].add(name);
			});
		});

		const contents: Set<NodeName> = new Set();
		const childGroups = this.spec.content?.match(/[a-zA-Z]+/gi);
		each(childGroups, (childGroupName) => {
			nodeGroups[childGroupName]?.forEach(childName => {
				contents.add(childName);
			})
		});

		this.contents = Array.from(contents);
	}

	get parents() {
		const parents = new Set()
		each(this.schema.nodes, n => {
			if (n.contents.includes(this.name)) {
				parents.add(n.name)
			}
		})

		return parents
	}

	get Tag() {
		return this.spec.tag ?? 'div';
	}

	get groups() {
		return this.groupsNames;
	}

	get dragHandle() {
		return this.spec.dragHandle;
	}

	get isCollapsible() {
		return !!this.spec.collapsible;
	}

	get isContainer() {
		return !!this.spec.container;
	}

	get isDocument() {
		return !!this.spec.document;
	}

	get isBlockSelectable() {
		return !!this.spec.blockSelectable;
	}

	get splits() {
		return !!this.spec.splits
	}

	get splitName() {
		return this.spec.splitName ?? 'section';
	}

	get replaceName() {
		return this.spec.replaceName ?? this.name;
	}

	get canSplit() {
		return false;
		// return [...listNames, 'title'].includes(this.name);
	}

	get isInline() {
		return !this.isBlock;
	}

	get isEmbedding() {
		return !!this.spec.embedding;
	}

	get isTextBlock() {
		return this.isBlock && this.inlineContent;
	}

	get isAtom() {
		return !!this.spec.atom;
	}

	get isIsolating() {
		return !!this.spec.isolating;
	}

	get isDraggable() {
		return !!this.spec.draggable;
	}

	get isSelectable() {
		return !!this.spec.selectable;
	}

	get isSandbox() {
		return !!this.spec.sandbox;
	}

	get isFocusable() {
		return !!this.spec.focusable;
	}

	get whitespace(): "pre" | "normal" {
		return this.spec.whitespace || (this.spec.code ? "pre" : "normal");
	}

	get isLeaf() {
		return this.contentMatch == ContentMatch.empty
	}

	hasRequiredAttrs() {
		// console.warn('hasRequiredAttrs is not implemented');
		return false
	}

	// create a default node based on schema
	default(): Optional<Node> {
		if (this.isText) {
			return this.schema.text('');
		}

		const blockJson: InitNodeJSON = {
			name: this.name,
			children: []
		}
		let { contentMatch } = this
		if (contentMatch.validEnd) {
			return this.schema.nodeFromJSON(blockJson)
		}

		while (contentMatch) {
			let { next: nextEdges, defaultType, validEnd } = contentMatch
			if (validEnd || !nextEdges) {
				break
			}
			if (defaultType && isArray(blockJson.children)) {
				blockJson.children.push(defaultType.default()?.toJSON())
			}
			contentMatch = nextEdges[0].next
		}

		const node = this.schema.nodeFromJSON(blockJson)
		if (!node) {
			throw new Error('node is null')
		}

		return node
	}

	create(content: Node[] | string): Optional<Node> {
		if (this.isText) {
			return this.schema.text(content as string);
		}
		return this.schema.node(this.name, { content: content as Node[] });
	}

	eq(other: NodeType) {
		return this.name === other.name;
	}

	//
	createAndFill() { }

	// allowsMarkType(markType: MarkType) {
	// 	return this.markSet == null || this.markSet.indexOf(markType) > -1
	// }

	// validContent(content: Fragment) {
	// 	let result = this.contentMatch.matchFragment(content)
	// 	if (!result || !result.validEnd) return false
	// 	for (let i = 0;i < content.childCount;i++)
	// 		if (!this.allowsMarks(content.child(i).marks)) return false
	// 	return true
	// }

	checkContent(content: Fragment) {
		// if (!this.validContent(content))
		// 	throw new RangeError(`Invalid content for node ${this.name}: ${content.toString().slice(0, 50)}`)
	}

	// allowsMarks(marks: readonly Mark[]) {
	// 	if (this.markSet == null) return true
	// 	for (let i = 0;i < marks.length;i++) {
	// 		if (!this.allowsMarkType(marks[i].type)) {
	// 			return false
	// 		}
	// 	}
	// 	return true
	// }

}

export class MarkType {}
