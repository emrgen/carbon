import {Mark, MarkSet,
  Node,
  NodeContent,
  NodeContentData,
  NodeData,
  NodeId,
  NodeProps,
  NodePropsJson,
  NodeType
} from "@emrgen/carbon-core";
import {reactive, ref, UnwrapNestedRefs} from "vue";
import {cloneDeep} from "lodash";
import {Optional} from "@emrgen/types";

export class VueNodeContent implements NodeContent {

  // make the data reactive
  static create(data: NodeContentData) {
    const content = reactive(data) as NodeContentData;
    return new VueNodeContent(content);
  }

  constructor(private content: NodeContentData) {
  }

  get data(): NodeData {
    return {} as any
  }

  get marks(): MarkSet {
    return this.content.marks;
  }

  renderVersion?: number | undefined;
  contentVersion?: number | undefined;
  addMark(marks: Mark): void {
      throw new Error("Method not implemented.");
  }
  removeMark(marks: Mark): void {
      throw new Error("Method not implemented.");
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
    } else {
      return this.content.children.map(c => c.textContent).join('');
    }
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
    return this.content.props;
  }

  get size(): number {
    return (this.type.isText) ? this.content.textContent.length : this.content.children.length;
  }

  child(index: number): Optional<Node> {
    return this.children[index];
  }

  unwrap(): NodeContentData {
    return cloneDeep(this.content)
  }

  setParent(parent: Optional<Node>): void {
    this.content.parent = parent;
  }

  setParentId(parentId: Optional<NodeId>): void {
    this.content.parentId = parentId;
  }

  changeType(type: NodeType): void {
    this.content.type = type;
  }

  insert(node: Node, index: number): void {
    this.children.splice(index, 0, node);
  }

  insertText(text: string, offset: number): void {
    this.content.textContent = this.content.textContent.slice(0, offset) + text + this.content.textContent.slice(offset);
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
      this.content.textContent = content;
    } else {
      this.content.children = content;
    }
  }

  updateProps(props: NodePropsJson): void {
    this.content.props.update(props);
  }

  clone(): NodeContent {
    throw new Error("Method not implemented.");
  }

  freeze(): NodeContent {
    throw new Error("Method not implemented.");
  }
}
