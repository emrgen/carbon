import {
  Maps,
  Node,
  NodeId,
  NodeContent as CoreNodeContent,
  NodeContentData,
  NodePropsJson,
  NodeType,
  NodeProps
} from "@emrgen/carbon-core";
import {Optional} from "@emrgen/types";
import {identity} from "lodash";
import {Scope} from "./Scope";

export class ImmutableNodeContent implements CoreNodeContent {

  static create(scope: Symbol, data: NodeContentData) {
    return new ImmutableNodeContent(scope, data);
  }

  constructor(private scope: Symbol, private data: NodeContentData) {
  }

  get id(): NodeId {
    return this.data.id;
  }

  get type(): NodeType {
    return this.data.type;
  }

  get parentId(): Optional<NodeId> {
    return this.data.parentId;
  }

  get parent(): Optional<Node> {
    const {parent} = this.data;
    if (parent) return parent;
    const map = Scope.get(this.scope);
    if (!this.parentId) return null;
    return map.get(this.parentId);
  }

  get children(): Node[] {
    return this.data.children;
  }

  get textContent(): string {
    if (this.data.type.isText) {
      return this.data.textContent;
    }
    return this.children.reduce((text, node) => text + node.textContent, '');
  }

  get linkName(): string {
    return this.data.linkName;
  }

  get links(): Record<string, Node> {
    return this.data.links;
  }

  get props(): NodeProps {
    return this.data.props;
  }

  get size(): number {
    return this.type.isText ? this.textContent.length : this.children.length
  }

  setParentId(parentId: NodeId) {
    this.data.parentId = parentId;
  }

  setParent(parent: Node) {
    this.data.parent = parent;
  }

  insertText(text: string, offset: number): void {
    this.data.textContent = this.textContent.slice(0, offset) + text + this.textContent.slice(offset);
  }

  removeText(offset: number, length: number): void {
    this.data.textContent = this.textContent.slice(0, offset) + this.textContent.slice(offset + length);
  }

  insert(node: Node, offset: number) {
    const {children} = this;
    this.data.children = [...children.slice(0, offset), node, ...children.slice(offset)];
  }

  remove(node: Node): boolean {
    const {data} = this;
    const {children} = data;
    const found = children.find(n => n.eq(node));
    if (!found) return false;

    data.children = children.filter(n => !n.eq(node));
    return !!found;
  }

  changeType(type: NodeType) {
    this.data.type = type;
    this.props.merge(type.props)
  }

  updateContent(content: string | Node[]): void {
    if (typeof content === 'string') {
      console.log('updateContent', content)
      this.data.textContent = content;
      return;
    }

    this.data.children = content as Node[];
  }

  updateProps(props: NodePropsJson): void {
    this.data.props.update(props);
  }

  addLink(name: string, node: Node) {
    this.data.links[name] = node;
  }

  removeLink(name: string) {
    const node = this.data.links[name];
    delete this.data.links[name];
    return node;
  }

  unwrap(): NodeContentData {
    return this.data
  }

  freeze() {
    this.data.parent = null;

    Object.freeze(this.data);
    Object.freeze(this);
    this.children.forEach(n => n.freeze());

    return this;
  }

  clone(map: Maps<Node, Optional<Node>> = identity): CoreNodeContent {
    const children = this.children.map(n => map(n)).filter(identity) as Node[];
    return new ImmutableNodeContent(this.scope, {
      ...this.data,
      children,
    });
  }
}
