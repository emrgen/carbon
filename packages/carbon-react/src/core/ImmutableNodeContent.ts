import {
  Maps,
  Node,
  NodeId,
  NodeContent,
  NodeContentData,
  NodePropsJson,
  NodeType,
  NodeProps, NodeData, Mark, MarkSet
} from "@emrgen/carbon-core";
import {Optional} from "@emrgen/types";
import {identity} from "lodash";
import {Scope} from "./Scope";

export class ImmutableNodeContent implements NodeContent {

  static create(scope: Symbol, data: NodeContentData) {
    return new ImmutableNodeContent(scope, data);
  }

  constructor(private scope: Symbol, private content: NodeContentData) {
  }

  get data(): NodeData {
    const {parent, type, children, ...rest} = this.content;
    return {
      ...rest,
      name: type.name,
      children: this.children.map(c => c.data),
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
    const {parent} = this.content;
    if (parent) return parent;
    const map = Scope.get(this.scope);
    if (!this.parentId) return null;
    return map.get(this.parentId);
  }

  get children(): Node[] {
    return this.content.children;
  }

  get textContent(): string {
    if (this.content.type.isText) {
      return this.content.textContent;
    }
    return this.children.reduce((text, node) => text + node.textContent, '');
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
    return this.type.isText ? this.textContent.length : this.children.length
  }

  child(index: number): Optional<Node> {
    return this.children[index];
  }

  setParentId(parentId: NodeId) {
    this.content.parentId = parentId;
  }

  setParent(parent: Node) {
    this.content.parent = parent;
  }

  insertText(text: string, offset: number): void {
    this.content.textContent = this.textContent.slice(0, offset) + text + this.textContent.slice(offset);
  }

  removeText(offset: number, length: number): void {
    this.content.textContent = this.textContent.slice(0, offset) + this.textContent.slice(offset + length);
  }

  insert(node: Node, offset: number) {
    const {children} = this;
    this.content.children = [...children.slice(0, offset), node, ...children.slice(offset)];
  }

  remove(node: Node): boolean {
    const {content} = this;
    const {children} = content;
    const found = children.find(n => n.eq(node));
    if (!found) return false;

    content.children = children.filter(n => !n.eq(node));
    return !!found;
  }

  changeType(type: NodeType) {
    this.content.type = type;
    this.props.merge(type.props)
  }

  updateContent(content: string | Node[]): void {
    if (typeof content === 'string') {
      console.log('updateContent', content)
      this.content.textContent = content;
      return;
    }

    this.content.children = content as Node[];
  }

  updateProps(props: NodePropsJson): void {
    this.content.props.update(props);
  }

  addLink(name: string, node: Node) {
    this.content.links[name] = node;
  }

  removeLink(name: string) {
    const node = this.content.links[name];
    delete this.content.links[name];
    return node;
  }

  unwrap(): NodeContentData {
    return this.content
  }

  freeze() {
    this.content.parent = null;

    Object.freeze(this.content);
    Object.freeze(this);
    this.children.forEach(n => n.freeze());

    return this;
  }

  clone(map: Maps<Node, Optional<Node>> = identity): NodeContent {
    const children = this.children.map(n => map(n)).filter(identity) as Node[];
    return new ImmutableNodeContent(this.scope, {
      ...this.content,
      children,
    });
  }

  addMark(marks: Mark): void {

  }

  removeMark(marks: Mark): void {
  }

}
