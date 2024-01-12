import {
  Maps,
  Mark,
  Node,
  NodeContent,
  NodeContentData,
  NodeData,
  NodeId,
  NodePropsJson,
  NodeType,
  StateScope,
  NodeProps, MarksPath, With
} from "@emrgen/carbon-core";
import {Optional} from "@emrgen/types";
import {identity} from "lodash";

export class ImmutableNodeContent implements NodeContent {

  static create(scope: Symbol, data: NodeContentData) {
    return new ImmutableNodeContent(scope, data);
  }

  constructor(private scope: Symbol, private content: NodeContentData) {
  }

  get data(): NodeData {
    const {parent,id, parentId, type, children, ...rest} = this.content;
    return {
      ...rest,
      id: id.toString(),
      parentId: parentId?.toString(),
      name: type.name,
      children: this.children.map(c => c.data),
      links: {},
      props: {},
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
    const map = StateScope.get(this.scope);
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

  get marks(): Record<string, Mark> {
    return this.props.get(MarksPath) ?? {}
  }

  get props(): NodeProps {
    return this.content.props;
  }

  get size(): number {
    return this.type.isText ? this.textContent.length : this.children.length
  }

  get isFrozen(): boolean {
    return Object.isFrozen(this);
  }

  // do a shallow clone
  private get mutable() {
    return this.isFrozen ? this.clone() : this;
  }

  child(index: number): Optional<Node> {
    return this.children[index];
  }

  setParentId(parentId: NodeId) {
    const {mutable} = this
    mutable.content.parentId = parentId;

    return mutable;
  }

  setParent(parent: Node) {
    const {mutable} = this
    mutable.content.parent = parent;

    return mutable;
  }

  insertText(text: string, offset: number) {
    const {mutable} = this
    mutable.content.textContent = this.textContent.slice(0, offset) + text + this.textContent.slice(offset);
    return mutable
  }

  removeText(offset: number, length: number) {
    const {mutable} = this
    mutable.content.textContent = this.textContent.slice(0, offset) + this.textContent.slice(offset + length);
    return mutable;
  }

  insert(node: Node, offset: number) {
    const {children, mutable} = this;
    mutable.content.children = [...children.slice(0, offset), node, ...children.slice(offset)];
    return mutable
  }

  remove(node: Node) {
    const {content, mutable} = this;
    const {children} = content;
    mutable.content.children = children.filter(n => !n.eq(node));
    return mutable
  }

  changeType(type: NodeType) {
    const { mutable} = this;
    mutable.content.type = type;
    mutable.props.merge(type.props)

    return mutable;
  }

  updateContent(content: string | Node[]) {
    const { mutable} = this;

    if (typeof content === 'string') {
      console.log('updateContent', content, Object.isFrozen(this.content))
      this.content.textContent = content;
      console.log('after updateContent', this.textContent, Object.isFrozen(this.content))
      return;
    }

    mutable.content.children = content as Node[];

    return mutable;
  }

  updateProps(props: NodePropsJson) {
    const { mutable} = this;
    console.debug('updateProps', props);
    mutable.content.props = this.content.props.merge(props);

    return mutable;
  }

  addLink(name: string, node: Node) {
    const { mutable} = this;
    mutable.content.links[name] = node;

    return mutable;
  }

  removeLink(name: string) {
    const { mutable} = this;
    delete mutable.content.links[name];

    return mutable;
  }

  unwrap(): NodeContentData {
    return {
      ...this.content,
      props: this.props.clone(),
    }
  }

  freeze(fn: With<Node>): NodeContent {
    if (this.isFrozen) return this;
    this.content.parent = null;

    // first freeze the children
    this.children.forEach(n => n.freeze(fn));
    Object.freeze(this.content);
    Object.freeze(this);

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
