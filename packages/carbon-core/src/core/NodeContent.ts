import {findIndex, flatten, identity} from 'lodash';

import {Node} from './Node';
import {Optional} from "@emrgen/types";
import {NodeId} from './NodeId';
import {Mark, NodePropsJson, NodeType, NodeProps, With} from "@emrgen/carbon-core";

// this is the data that is used to create a node
export interface NodeData {
  // id is used to identify the node
  id: string;
  // name is used to identify the node type
  name: string;
  // parentId is used to identify the link in the parent node
  parentId?: string;
  // textContent is used to identify the link in the parent node
  textContent?: string;
  // children are used to identify the link in the parent node
  children?: NodeData[];
  // link name is used to identify the link in the parent node
  linkName?: string;
  // links are used to identify the link in the child node
  links?: Record<string, NodeData>;
  // props are used to identify the link in the child node
  props?: NodePropsJson;
}

// all the data a node needs to function
// this is the core of the node
// for functional style programming this is the data that is passed around and manipulated
export interface NodeContentData {
  id: NodeId;
  type: NodeType;
  parentId: Optional<NodeId>;
  parent: Optional<Node>;
  textContent: string;
  children: Node[];
  linkName: string;
  links: Record<string, Node>;
  props: NodeProps;
  // track the version of the content that requires a re-render
  renderVersion?: number;
  // track the version of the content, this is used to structural changes(useful for various caching and optimizations)
  contentVersion?: number;
}

export interface NodeContent extends NodeContentData, MutableNodeContent {
  size: number;
  data: NodeData;

  unwrap(): NodeContentData;

  child(index: number): Optional<Node>;
}

export interface MutableNodeContent {
  setParentId(parentId: Optional<NodeId>): NodeContent;

  setParent(parent: Optional<Node>): NodeContent;

  changeType(type: NodeType): NodeContent;

  insert(node: Node, index: number): NodeContent;

  remove(node: Node): NodeContent;

  // replace(node: Node): void;
  insertText(text: string, offset: number): NodeContent;

  removeText(offset: number, length: number): NodeContent;

  addLink(name: string, node: Node): NodeContent;

  removeLink(name: string): NodeContent;

  updateContent(content: Node[] | string): NodeContent;

  updateProps(props: NodePropsJson): NodeContent;

  clone(): NodeContent;

  freeze(fn: With<Node>): NodeContent;
}

export class PlainNodeContent implements NodeContent {

  static create(content: NodeContentData): NodeContent {
    return new PlainNodeContent(content);
  }

  renderVersion = 0;
  contentVersion = 0;

  constructor(private content: NodeContentData) {
  }

  replace(node: Node): void {
    throw new Error('Method not implemented.');
  }

  get data(): NodeData {
    const {parent, type, id, parentId, children, ...rest} = this.content;
    return {
      ...rest,
      id: id.toString(),
      parentId: parentId?.toString(),
      name: type.name,
      children: this.children.map(c => c.data),
      links: {},
    }
  }

  get id(): NodeId {
    return this.content.id;
  }

  get type(): NodeType {
    return this.content.type;
  }

  get parentId(): Optional<NodeId> {
    return this.content.parentId;
  }

  get parent(): Optional<Node> {
    return this.content.parent;
  }

  get children(): Node[] {
    return this.content.children;
  }

  get textContent(): string {
    return this.type.isText ? this.content.textContent : this.children.map(n => n.textContent).join('');
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

  get size(): number {
    return (this.type.isText) ? this.textContent.length : this.children.length;
  }

  // return shallow clone of data
  // the children are same references as the original
  unwrap(): NodeContentData {
    return {...this.content};
  }

  child(index: number): Optional<Node> {
    return this.children[index];
  }

  changeType(type: NodeType) {
    this.content.type = type;
    this.props.merge(type.props);

    return this;
  }

  clone(): NodeContent {
    throw new Error("Method not implemented.");
  }

  freeze(): NodeContent {
    throw new Error("Method not implemented.");
  }

  insert(node: Node, index: number) {
    this.children.splice(index, 0, node);

    return this;
  }

  remove(node: Node) {
    this.content.children = this.children.filter(n => n.eq(node));

    return this;
  }

  insertText(text: string, offset: number) {
    this.content.textContent = this.textContent.slice(0, offset) + text + this.textContent.slice(offset);

    return this;
  }

  removeText(offset: number, length: number) {
    this.content.textContent = this.textContent.slice(0, offset) + this.textContent.slice(offset + length);

    return this;
  }

  setParent(parent: Optional<Node>) {
    this.content.parent = parent;

    return this;
  }

  setParentId(parentId: Optional<NodeId>) {
    this.content.parentId = parentId;

    return this;
  }

  updateContent(content: Node[] | string) {
    if (typeof content === 'string') {
      this.content.textContent = content;
    } else {
      this.content.children = content;
    }

    return this;
  }

  updateProps(props: NodePropsJson) {
    this.props.merge(props);

    return this;
  }

  addLink(name: string, node: Node) {
    this.links[name] = node;

    return this;
  }

  removeLink(name: string) {
    delete this.links[name];
    return this
  }
}
