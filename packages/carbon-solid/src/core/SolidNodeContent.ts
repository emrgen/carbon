import {
  Mark,
  Node,
  NodeContent,
  NodeContentData, NodeData,
  NodeId,
  NodePropsJson,
  NodeType,
  NodeProps, NodeMap, Path,
} from "@emrgen/carbon-core";
import {createMutable, Store, unwrap} from "solid-js/store";
import {Optional} from "@emrgen/types";
import {each, reduce} from "lodash";


export class SolidNodeContent implements NodeContent {
  protected content: Store<NodeContentData>;

  static create(data: NodeContentData): SolidNodeContent {
    const {id, type, children = [], textContent, parent, parentId, props, links = {}, linkName = '', renderVersion = 0, contentVersion= 0 } = data;
    const store = createMutable<NodeContentData>({
      id,
      type,
      parent,
      parentId,
      children,
      linkName,
      links,
      props,
      textContent,
      renderVersion,
      contentVersion,
    });

    return new SolidNodeContent(id, store);
  }

  constructor(id: NodeId, store: SolidNodeContent['content']) {
    this.content = store;
  }

  get renderVersion(): number {
    return this.content.renderVersion!;
  }

  set renderVersion(version: number) {
    this.content.renderVersion = version;
  }

  get contentVersion(): number {
    return this.content.contentVersion!;
  }

  set contentVersion(version: number) {
    this.content.contentVersion = version;
  }

  get data(): NodeData {
    const unwrap = this.unwrap();
    const { parent,id, parentId, type,children, ...rest} = unwrap;

    return {
      ...rest,
      id: id.toString(),
      parentId: parentId?.toString(),
      name: type.name,
      children: children.map(child => child.data),
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

  get textContent(): string {
    if (this.type.isText) {
      return this.content.textContent;
    }

    // console.log("textContent is not available for non-text nodes")
    return this.children.map(child => child.textContent).join("");
  }

  get children(): Node[] {
    return this.content.children;
  }

  get linkName(): string {
    return this.content.linkName;
  }

  get links(): Record<string, Node> {
    return this.content.links;
  }

  get props(): NodeProps {
    return this.content.props
  }

  get size(): number {
    if (this.type.isText) {
      return this.textContent.length
    }
    return this.children.length
  }

  child(index: number): Node {
    return this.children[index];
  }

  unwrap(): NodeContentData {
    // console.log('unwrap', this.id.toString())
    const content =  unwrap(this.content);
    return {
      ...content,
    }
  }

  setParentId(parentId: Optional<NodeId>): NodeContent {
    this.content.parentId = parentId;
    return this;
  }

  setParent(parent: Optional<Node>): NodeContent {
    this.content.parent = parent;
    return this;
  }

  changeType(type: NodeType): void {
    this.content.type = type;
    this.content.props = this.props.merge(type.props);
  }

  insert(node: Node, index: number): void {
    this.content.children.splice(index, 0, node);
  }

  remove(node: Node): void {
    const index = this.children.findIndex(child => child.eq(node))
    if (index === -1) {
      throw new Error("Node is not found");
    }
    this.content.children.splice(index, 1);
  }

  replace(index: number, node: Node) {
    this.content.children.splice(index, 1, node);
  }

  insertText(text: string, index: number): void {
    if (!this.type.isText) {
      throw new Error("Cannot insert text into non-text node");
    }

    this.content.textContent = this.textContent.slice(0, index) + text + this.textContent.slice(index);
  }

  removeText(offset: number, length: number): void {
    if (!this.type.isText) {
      throw new Error("Cannot remove text from non-text node");
    }

    this.content.textContent = this.textContent.slice(0, offset) + this.textContent.slice(offset + length);
  }

  addLink(name: string, node: Node): void {
    this.content.links[name] = node;
  }


  removeLink(name: string): Optional<Node> {
    return undefined;
  }

  updateContent(content: Node[] | string): void {
    if (typeof content === "string") {
      this.content.textContent = content;
    } else {
      this.content.children = content;
    }
  }

  updateProps(props: NodePropsJson): void {
    this.content.props = this.content.props.merge(props);
  }

  clone(): NodeContent {
    throw new Error("Method not implemented.");
  }

  freeze(): NodeContent {
    throw new Error("Method not implemented.");
  }

  unfreeze(path: Path, map: NodeMap): NodeContent {
    throw new Error("Method not implemented.");
  }

}
