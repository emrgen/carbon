import {
  Maps,
  Mark,
  MarksPath,
  Node,
  NodeContent,
  NodeContentData,
  NodeData,
  NodeId,
  NodeMap,
  NodeProps,
  NodePropsJson,
  NodeType,
  Path,
  StateScope,
  With
} from "@emrgen/carbon-core";
import {Optional} from "@emrgen/types";
import {identity, isString} from "lodash";

export class ImmutableNodeContent implements NodeContent {

  static create(scope: Symbol, data: NodeContentData) {
    return new ImmutableNodeContent(scope, data);
  }

  constructor(private scope: Symbol, private content: NodeContentData) {}

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
    const map = StateScope.get();
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

  child(index: number): Optional<Node> {
    return this.children[index];
  }

  setParentId(parentId: NodeId) {
    this.content.parentId = parentId;
    return this
  }

  setParent(parent: Node) {
    this.content.parent = parent;
    return this
  }

  insertText(text: string, offset: number) {
    this.content.textContent = this.textContent.slice(0, offset) + text + this.textContent.slice(offset);
  }

  removeText(offset: number, length: number) {
    this.content.textContent = this.textContent.slice(0, offset) + this.textContent.slice(offset + length);
  }

  insert(node: Node, offset: number) {
    const {children} = this;
    this.content.children = [...children.slice(0, offset), node, ...children.slice(offset)];
  }

  remove(node: Node) {
    const {content} = this;
    const {children} = content;
    this.content.children = children.filter(n => !n.eq(node));
    node.setParent(null);
    node.setParentId(null);
  }

  replace(index: number, node: Node) {
    this.content.children[index] = node;
  }

  changeType(type: NodeType) {
    this.content.type = type;
    this.props.merge(type.props)
  }

  updateContent(content: string | Node[]) {
    if (typeof content === 'string') {
      console.log('updateContent', content, Object.isFrozen(this.content))
      this.content.textContent = content;
      console.log('after updateContent', this.textContent, Object.isFrozen(this.content))
      return;
    }

    this.content.children = content as Node[];
  }

  updateProps(props: NodePropsJson) {
    this.content.props = this.content.props.merge(props);
  }

  addLink(name: string, node: Node) {
    this.content.links[name] = node;
  }

  removeLink(name: string) {
    delete this.content.links[name];
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


  // do a shallow clone
  unfreeze(path: Path, map: NodeMap): NodeContent {
    const mutable = this.isFrozen ? this.clone() : this;
    if (path.length === 0) {
      return mutable;
    }

    const [index, ...rest] = path;

    if (isString(index)) {
      const child = mutable.links[index];
      if (!child) {
        throw new Error(`child not found at ${index}`)
      }

      const mutableChild = child.unfreeze(rest, map);
      mutable.addLink(index, mutableChild);

      return mutable;
    } else {
      const child = mutable.children[index];
      if (!child) {
        throw new Error(`child not found at ${index}`)
      }

      const mutableChild = child.unfreeze(rest, map);
      mutable.replace(index, mutableChild);

      return mutable;
    }
  }

  clone(map: Maps<Node, Optional<Node>> = identity): NodeContent {
    const children = this.children.map(n => map(n)).filter(identity) as Node[];
    return new ImmutableNodeContent(this.scope, {
      ...this.content,
      children,
    });
  }

}
