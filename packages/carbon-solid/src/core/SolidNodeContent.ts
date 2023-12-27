import {
  Node,
  NodeContent,
  NodeData,
  NodeId,
  NodeProps,
  NodePropsJson,
  NodeType
} from "@emrgen/carbon-core";
import {createMutable, Store, unwrap} from "solid-js/store";
import {Optional} from "@emrgen/types";

export class SolidNodeContent implements NodeContent {
  store: Store<NodeData>;

  static create(data: NodeData): SolidNodeContent {
    const {id, type, children = [], textContent, parent, parentId, props, links = {}, linkName = '', } = data;
    const store = createMutable<NodeData>({
      id,
      type,
      parent,
      parentId,
      children,
      linkName,
      links,
      props,
      textContent,
    });

    return new SolidNodeContent(id, store);
  }

  constructor(id: NodeId, store: SolidNodeContent['store']) {
    this.store = store;
  }

  get id(): NodeId {
    return this.store.id;
  }

  get type(): NodeType {
    return this.store.type;
  }

  get parentId(): Optional<NodeId> {
    return this.store.parentId;
  }

  get parent(): Optional<Node> {
    return this.store.parent;
  }

  get textContent(): string {
    if (this.type.isText) {
      return this.store.textContent;
    }

    // console.log("textContent is not available for non-text nodes")
    return this.children.map(child => child.textContent).join("");
  }

  get children(): Node[] {
    return this.store.children;
  }

  get linkName(): string {
    return this.store.linkName;
  }

  get links(): Record<string, Node> {
    return this.store.links;
  }

  get props(): NodeProps {
    return this.store.props
  }

  get size(): number {
    return this.children.length
  }

  child(index: number): Node {
    return this.children[index];
  }

  unwrap(): NodeData {
    return unwrap(this.store);
  }

  setParentId(parentId: Optional<NodeId>): void {
    this.store.parentId = parentId;
  }

  insert(node: Node, index: number): void {
  }

  insertText(text: string, index: number): void {
  }

  remove(node: Node): void {
  }

  setParent(parent: Optional<Node>): void {
  }

  updateContent(content: Node[] | string): void {
  }

  updateProps(props: NodePropsJson): void {
  }


  addLink(name: string, node: Node): void {
  }

  changeType(type: NodeType): void {
  }

  clone(): NodeContent {
    throw new Error("Method not implemented.");
  }

  freeze(): NodeContent {
    throw new Error("Method not implemented.");
  }

  removeLink(name: string): Optional<Node> {
    return undefined;
  }

  removeText(offset: number, length: number): void {
  }
}
