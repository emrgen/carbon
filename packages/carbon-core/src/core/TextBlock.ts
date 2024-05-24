import { classString } from "./Logger";
import { MarkSet } from "./Mark";
import { Node } from "./Node";
import { reduce } from "lodash";
import { cloneFrozenNode, deepCloneMap, Pin } from "@emrgen/carbon-core";
import { InlineNode } from "./InlineNode";

// utility class for text blocks
// title is a text block
// a text block contains inline children like text, links, hashtags, mentions, etc
// when you type in a text block, you are typing in the inline content
// when merging text blocks, you are merging the inline content along with the content marks
export class TextBlock {
  private node: Node;

  static from(node: Node) {
    return new TextBlock(node.clone(deepCloneMap));
  }

  constructor(node: Node) {
    if (!node.isTextContainer) {
      throw new Error("can not create text block from non text block node");
    }

    this.node = node;
  }

  get textContent() {
    return this.node.textContent;
  }

  intoContent() {
    return this.node.unwrap();
  }

  normalizeContent() {
    const { children } = this.node;
    // merge adjacent text nodes with the same marks
    return (
      children.reduce((acc, curr, index) => {
        if (index === 0) {
          return [curr];
        }

        const prev = acc[acc.length - 1];
        const prevMarks = MarkSet.from(prev.marks);
        const currMarks = MarkSet.from(curr.marks);
        if (prevMarks.eq(currMarks)) {
          const prevClone = prev.clone();
          acc.pop();

          const newNode = InlineNode.from(prev).merge(curr);

          acc.push(newNode);
          return acc;
        }

        return [...acc, curr];
      }, [] as Node[]) ?? []
    );
  }

  removeContent(from: number, to: number): Node[] {
    if (from === to) {
      return this.node.children;
    }

    const start = Pin.create(this.node, from);
    const end = Pin.create(this.node, to);
    const startDown = start.down().rightAlign;
    const endDown = end.down().leftAlign;
    const { node: startNode } = startDown;
    const { node: endNode } = endDown;

    if (startNode.eq(endNode)) {
      const textContent =
        startNode.textContent.slice(0, startDown.offset) +
        endNode.textContent.slice(endDown.offset);
      const textNode = startNode.type.create(
        textContent,
        startNode.props.toJSON(),
      )!;

      console.log(
        "UPDATED NODE",
        textNode.textContent,
        textNode.marks,
        startNode.marks,
      );

      return (
        this.node.children.map((child) => {
          if (child.eq(startNode)) {
            return textNode;
          }
          return child;
        }) ?? ([] as Node[]).map(cloneFrozenNode)
      );
    }

    return [];
  }

  // check if a and b have the same content and marks in the same order
  static isSimilarContent(a: Node[], b: Node[]) {
    if (a.length !== b.length) {
      return false;
    }

    for (let i = 0; i < a.length; i++) {
      if (!InlineNode.isSimilar(a[i], b[i])) {
        return false;
      }
    }

    return true;
  }

  private normalize(): TextBlock {
    const nodes = reduce(
      this.node.children,
      (acc, curr) => {
        if (acc.length === 0) {
          return [curr];
        }

        const prev = acc[acc.length - 1];

        // const newNode = prev.tryMerge(curr);
        // if (!newNode) {
        //   return [...acc, curr]
        // }

        return [...acc.slice(0, -1)];
      },
      [] as Node[],
    );

    // this.node.content = BlockContent.create(nodes);

    return this;
  }

  toJSON() {
    return this.node.toJSON();
  }

  toString(): string {
    return classString(this)(this.node.toJSON());
  }
}
