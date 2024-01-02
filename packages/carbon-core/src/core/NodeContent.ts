import { findIndex, flatten, identity } from 'lodash';

import { Node } from './Node';
import { Optional } from "@emrgen/types";
import { NodeId } from './NodeId';
import { Maps, With } from './types';
import {Mark, MarkSet, NodeProps, NodePropsJson, NodeType} from "@emrgen/carbon-core";

export interface NodeData {
  id: string;
  name: string;
  parentId: Optional<string>;
  textContent: string;
  children: NodeData[];
  linkName: string;
  links: Record<string, NodeData>;
  props?: NodePropsJson;
  marks?: string[]
}

// all the data a node needs to be created
// this is the core of the node
export interface NodeContentData {
  id: NodeId;
  type: NodeType;
  parentId: Optional<NodeId>;
  parent: Optional<Node>;
  textContent: string;
  children: Node[];
  linkName: string;
  links: Record<string, Node>;
  marks: MarkSet;
  props: NodeProps;
  renderVersion?: number;
  contentVersion?: number;
}

export interface NodeContent extends NodeContentData, MutableNodeContent{
  size: number;
  data: NodeData;

  unwrap(): NodeContentData;

  child(index: number): Optional<Node>;
}

export interface MutableNodeContent {
  setParentId(parentId: Optional<NodeId>): void;
  setParent(parent: Optional<Node>): void;
  changeType(type: NodeType): void;
  insert(node: Node, index: number): void;
  remove(node: Node): void;
  insertText(text: string, offset: number): void;
  removeText(offset: number, length: number): void;
  addLink(name: string, node: Node): void;
  removeLink(name: string): Optional<Node>;
  updateContent(content: Node[] | string): void;
  updateProps(props: NodePropsJson): void;
  addMark(marks: Mark): void;
  removeMark(marks: Mark): void;

  clone(): NodeContent;
  freeze(): void;
}

export class PlainNodeContent implements NodeContent {

  static create(content: NodeContentData): NodeContent {
    return new PlainNodeContent(content);
  }

  constructor(private content: NodeContentData) {}

  get data(): NodeData {
    const {parent, type, id, parentId,children, ...rest} = this.content;
    return {
      ...rest,
      id: id.toString(),
      parentId: parentId?.toString(),
      name: type.name,
      children: this.children.map(c => c.data),
      links: {},
      marks: [],
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

  get marks(): MarkSet {
    return this.content.marks;
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
    return { ...this.content };
  }

  child(index: number): Optional<Node> {
    return this.children[index];
  }

  changeType(type: NodeType): void {
    this.content.type = type;
    this.props.update(type.props);
  }

  clone(): NodeContent {
    throw new Error("Method not implemented.");
  }

  freeze(): NodeContent {
    throw new Error("Method not implemented.");
  }

  insert(node: Node, index: number): void {
    this.children.splice(index, 0, node);
  }

  remove(node: Node): void {
    this.content.children = this.children.filter(n => n.eq(node));
  }

  insertText(text: string, offset: number): void {
    this.content.textContent = this.textContent.slice(0, offset) + text + this.textContent.slice(offset);
  }

  removeText(offset: number, length: number): void {
    this.content.textContent = this.textContent.slice(0, offset) + this.textContent.slice(offset + length);
  }

  setParent(parent: Optional<Node>): void {
    this.content.parent = parent;
  }

  setParentId(parentId: Optional<NodeId>): void {
    this.content.parentId = parentId;
  }

  updateContent(content: Node[] | string): void {
    if (typeof content === 'string') {
      this.content.textContent = content;
    } else {
      this.content.children = content;
    }
  }

  updateProps(props: NodePropsJson): void {
    this.props.update(props);
  }

  addLink(name: string, node: Node): void {
    this.links[name] = node;
  }

  removeLink(name: string): Optional<Node> {
    const node = this.links[name];
    delete this.links[name];
    return node;
  }


  addMark(props: Mark): void {
    // this.content.marks.update(props);
  }

  removeMark(props: Mark): void {
    // this.content.marks.removeMarks();
  }
}
