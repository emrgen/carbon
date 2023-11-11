import { classString } from "./Logger";
import { Mark, MarkSet } from "./Mark";
import { Node } from "./Node";
import { InlineContent } from "./NodeContent";
import { node } from '@emrgen/carbon-blocks';
import { Optional } from '@emrgen/types';

// utility class for text blocks
// title is a text block
// a text block contains inline children like text, links, hashtags, mentions, etc
// when you type in a text block, you are typing in the inline content
// when merging text blocks, you are merging the inline content along with the content marks
export class TextBlock extends Node {

  static fromParent(node: Node): Optional<TextBlock> {
    const textBlock = node.child(0);
    if (textBlock && textBlock.isTextBlock) {
      return new TextBlock(textBlock);
    }
  }

  static from(node: Node) {
    return new TextBlock(node.clone());
  }

  constructor(node: Node) {
    super(node);
  }

  get textContent() {
    return this.content.textContent;
  }

  intoContent() {
    return this.content;
  }

  addMark(mark: Mark, start: number, end: number) {

  }

  removeMark(mark: Mark, start: number, end: number) {

  }

  insertText(text: string, start: number, marks?: MarkSet) {}

  merge(other: TextBlock): TextBlock {
    return this
  }

  split(offset: number): [TextBlock, TextBlock] {
    return [this, this]
  }

  toJSON() {
    return {
      ...super.toJSON(),
      type: 'text-block'
    }
  }

  toString(): string {
    return classString(this)({
      id: this.id.toString(),
      name: this.type.name,
      marks: this.marks.toString(),
      content: this.content.toJSON(),
    })
  }
}
