import BTree from "sorted-btree";

export class ImmutableBTreeContent {
  btree = new BTree();

  // static create(scope: Symbol, data: NodeContentData) {
  //   return new ImmutableBTreeContent(scope, data);
  // }
  //
  // constructor(
  //   private scope: Symbol,
  //   content: NodeContentData,
  // ) {}
  //
  // addLink(name: string, node: Node): void {
  //   this.con
  // }
  //
  // changeType(type: NodeType): void {}
  //
  // child(index: number): Optional<Node> {
  //   return undefined;
  // }
  //
  // clone(): NodeContent {
  //   return undefined;
  // }
  //
  // freeze(fn: With<Node>): NodeContent {
  //   return undefined;
  // }
  //
  // insert(node: Node, index: number): void {
  //   if (this.type.isPage) {
  //     node.fractionIndex = this.getFractionIndex(index);
  //   }
  // }
  //
  // private getFractionIndex(index: number) {
  //   const before = this.child(index - 1) as ImmutableNode;
  //   const after = this.child(index) as ImmutableNode;
  //   return generateKeyBetween(before.fractionIndex, after.fractionIndex);
  // }
  //
  // insertText(text: string, offset: number): void {}
  //
  // remove(node: Node): void {}
  //
  // removeLink(name: string): void {}
  //
  // removeText(offset: number, length: number): void {}
  //
  // replace(index: number, node: Node): void {}
  //
  // setParent(parent: Optional<Node>): NodeContent {
  //   return undefined;
  // }
  //
  // setParentId(parentId: Optional<NodeId>): NodeContent {
  //   return undefined;
  // }
  //
  // unfreeze(path: Path, map: NodeMap): NodeContent {
  //   return undefined;
  // }
  //
  // unwrap(): NodeContentData {
  //   return undefined;
  // }
  //
  // updateContent(content: Node[] | string): void {}
  //
  // updateProps(props: NodePropsJson): void {}
}
