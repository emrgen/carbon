import { classString } from "./Logger";
import { Mark, MarkSet } from "./Mark";
import { Node } from "./Node";
import { BlockContent, InlineContent, NodeContent } from "./NodeContent";
import { node } from '@emrgen/carbon-blocks';
import { Optional } from '@emrgen/types';
import { flatten, identity, reduce } from "lodash";

// utility class for text blocks
// title is a text block
// a text block contains inline children like text, links, hashtags, mentions, etc
// when you type in a text block, you are typing in the inline content
// when merging text blocks, you are merging the inline content along with the content marks
export class TextBlock {
  private node: Node;

  static from(node: Node) {
    return new TextBlock(node.clone());
  }

  constructor(node: Node) {
    if (!node.isTextBlock) {
      throw new Error('can not create text block from non text block node');
    }

    this.node = node;
  }

  get textContent() {
    return this.node.textContent;
  }

  intoContent() {
    return this.node.content;
  }

  // @mutation
  addMark(mark: Mark, start: number, end: number) {
    // split the content and add the mark in the relevant node
  }

  // @mutation
  removeMark(mark: Mark, start: number, end: number) {
  }

  // @mutation
  insert(node: Node, offset: number) {
    if (!node.isInline) {
      throw new Error('node is not inline');
    }

    if (offset <= 0) {
      this.node.content.prepend([node]);
      return;
    }

    if (offset >= this.node.focusSize) {
      this.node.content.append([node]);
      return;
    }

    const found = this.find(offset);
    if (!found) return;

    // split the content and insert the inline node in the relevant node
    const nodes = this.split(offset).reduce((acc, curr) => {
      return curr.size === 0 ? acc : [...acc, ...curr.children];
    }, [] as Node[]);


    this.node.replace(found, nodes);
    // normalize the content
    this.normalize();
  }

  //
  private find(offset: number): Optional<Node> {
     for (const node of this.node.content.children) {
      if (node.isInline) {
        if (offset === node.focusSize) return node;

        if (offset > node.focusSize) {
          offset -= node.focusSize;
        } else {
          return node;
        }
      }
    }
  }

  tryMerge(other: TextBlock): Optional<TextBlock> {
    const node = this.node.tryMerge(other.node);
    if (!node) {
      return null;
    }

    return new TextBlock(node);
  }

  private normalize(): TextBlock {
    const nodes = reduce(this.node.children, (acc, curr) => {
      if (acc.length === 0) {
        return [curr]
      }

      const prev = acc[acc.length - 1];

      const newNode = prev.tryMerge(curr);
      if (!newNode) {
        return [...acc, curr]
      }

      return [...acc.slice(0, -1), newNode];
    }, [] as Node[]);

    this.node.content = BlockContent.create(nodes);

    return this
  }

  split(offset: number): [NodeContent, NodeContent] {
    return this.node.content.split(offset);
  }

  toJSON() {
    return this.node.toJSON();
  }

  toString(): string {
    return classString(this)(this.node.toJSON())
  }
}
