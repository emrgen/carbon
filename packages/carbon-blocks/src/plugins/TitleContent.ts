import { BlockContent, Node } from "@emrgen/carbon-core";

export class TitleContent {
  static from(node: Node) {
    return new TitleContent(BlockContent.create(node.children));
  }

  constructor(readonly content: BlockContent) {
    this.content = content;
  }

  get textContent() {
    return this.content.textContent;
  }

  get children() {
    return this.content.children;
  }

  insert(offset: number, text: string): TitleContent {
    return new TitleContent(this.content.insert(offset, text));
  }

  remove(offset: number, size: number): TitleContent {}

  // consumes
  into(): BlockContent {
    return this.content
  }
}
