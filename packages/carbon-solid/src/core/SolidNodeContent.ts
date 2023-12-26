import {
  Node,
  NodeContent as CoreNodeContent,
  NodeData,
  NodeId,
  NodeProps,
  NodePropsJson,
  NodeType
} from "@emrgen/carbon-core";
import {createMutable, Store} from "solid-js/store";
import {Optional} from "@emrgen/types";

export class SolidNodeContent implements CoreNodeContent {
  id: NodeId;
  store: Store<Omit<NodeData,'id'>>;

  static create(data: NodeData): SolidNodeContent {
    const {id, type, children = [], links = {}, linkName = '', props} = data;
    const store = createMutable<SolidNodeContent['store']>({
      children,
      linkName,
      links,
      parent: null,
      parentId: null,
      props: properties,
      textContent: "",
      type,
    });

    return new SolidNodeContent(id, store);
  }

  constructor(id: NodeId, store: SolidNodeContent['store'] ) {
    this.id = id;
    this.store = store;
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
    return this.store.textContent;
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

  get properties(): NodeProps {
    return this.store.props
  }

  get size(): number {
    return this.children.length
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

  clone(): SolidNodeContent {
    throw new Error("Method not implemented.");
  }

  freeze(): SolidNodeContent {
    throw new Error("Method not implemented.");
  }

  removeLink(name: string): Optional<Node> {
    return undefined;
  }

  removeText(offset: number, length: number): void {
  }
}
