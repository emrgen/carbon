import { findIndex, flatten, identity } from 'lodash';

import { Node } from './Node';
import { Optional } from "@emrgen/types";
import { NodeId } from './NodeId';
import { Maps, With } from './types';
import {NodeProps, NodePropsJson, NodeType} from "@emrgen/carbon-core";

// all the data a node needs to be created
// this is the core of the node
export interface NodeData {
  id: NodeId;
  type: NodeType;
  parentId: Optional<NodeId>;
  parent: Optional<Node>;
  textContent: string;
  children: Node[];
  linkName: string;
  links: Record<string, Node>;
  props: NodeProps;
}

export interface NodeContent extends NodeData, MutableNodeContent{
  size: number;

  unwrap(): NodeData;
}

export interface MutableNodeContent {
  setParentId(parentId: Optional<NodeId>): void;
  setParent(parent: Optional<Node>): void;
  changeType(type: NodeType): void;
  insert(node: Node, index: number): void;
  insertText(text: string, offset: number): void;
  removeText(offset: number, length: number): void;
  addLink(name: string, node: Node): void;
  removeLink(name: string): Optional<Node>;
  remove(node: Node): void;
  updateContent(content: Node[] | string): void;
  updateProps(props: NodePropsJson): void;
  clone(): NodeContent;
  freeze(): NodeContent;
}

export class EmptyNodeContent implements NodeContent{
  children: Node[];
  id: NodeId;
  parent: Optional<Node>;
  parentId: Optional<NodeId>;
  textContent: string;
  type: NodeType;
  linkName: string;
  links: Record<string, Node>;
  props: NodeProps;

  static create(id: NodeId, type: NodeType): NodeContent {
    return new EmptyNodeContent(id, type);
  }

  get size(): number {
    return this.children.length
  }

  constructor(id: NodeId, type: NodeType) {
    this.id = id;
    this.type = type;
    this.textContent = '';
    this.children = [];
    this.parentId = null;
    this.parent = null;
    this.props = NodeProps.empty();
    this.linkName = '';
    this.links = {};
  }

  unwrap(): NodeData {
    return this;
  }

  changeType(type: NodeType): void {
    this.type = type;
  }

  clone(): NodeContent {
    throw new Error("Method not implemented.");
  }

  freeze(): NodeContent {
    throw new Error("Method not implemented.");
  }

  insert(node: Node, index: number): void {
  }

  insertText(text: string, offset: number): void {
  }

  remove(node: Node): void {
  }

  removeText(offset: number, length: number): void {
  }

  setParent(parent: Optional<Node>): void {
  }

  setParentId(parentId: Optional<NodeId>): void {
  }

  updateContent(content: Node[] | string): void {
  }

  updateProps(props: NodePropsJson): void {
  }

  addLink(name: string, node: Node): void {
  }

  removeLink(name: string): Optional<Node> {
    return undefined;
  }
}
