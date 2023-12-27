import {Node, NodeContent, NodeData, NodeId, NodeProps, NodePropsJson, NodeType} from "@emrgen/carbon-core";
import {reactive, ref} from "vue";
import {cloneDeep} from "lodash";
import {Optional} from "@emrgen/types";

export class VueNodeContent implements NodeContent {

  // make the data reactive
  static create(data: NodeData) {
    // const active = {
    //   id: data.id,
    //   type: data.type,
    //   parentId: data.parentId,
    //   parent: data.parent,
    //   textContent: data.textContent,
    //   children: data.children,
    //   linkName: data.linkName,
    //   links: data.links,
    //   props: data.props,
    // }

    return new VueNodeContent(data);
  }
  constructor(private store: NodeData) {}

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
    } else {
      return this.store.children.map(c => c.textContent).join('');
    }
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
    return this.store.props;
  }

  get size(): number {
    return (this.type.isText) ? this.store.textContent.length : this.store.children.length;
  }

  child(index: number): Optional<Node> {
    return this.children[index];
  }

  unwrap(): NodeData {
    return cloneDeep(this.store)
  }

  setParent(parent: Optional<Node>): void {
    this.store.parent = parent;
  }

  setParentId(parentId: Optional<NodeId>): void {
    this.store.parentId = parentId;
  }

  changeType(type: NodeType): void {
    this.store.type = type;
  }

  insert(node: Node, index: number): void {
    this.children.splice(index, 0, node);
  }

  insertText(text: string, offset: number): void {
    this.store.textContent = this.store.textContent.slice(0, offset) + text + this.store.textContent.slice(offset);
  }

  remove(node: Node): void {
    const found = this.children.findIndex(n => n.id === node.id);
    if (found >= 0) {
      this.children.splice(found, 1);
    }
  }

  removeLink(name: string): Optional<Node> {
    return undefined;
  }

  removeText(offset: number, length: number): void {
  }

  addLink(name: string, node: Node): void {
  }

  updateContent(content: Node[] | string): void {
    if (typeof content === "string") {
      this.store.textContent = content;
    } else {
      this.store.children = content;
    }
  }

  updateProps(props: NodePropsJson): void {
    this.store.props.update(props);
  }

  clone(): NodeContent {
    throw new Error("Method not implemented.");
  }

  freeze(): NodeContent {
    throw new Error("Method not implemented.");
  }
}
