import { classString } from "./Logger";
import { MarkSet } from "./Mark";
import { Node } from "./Node";
import {
  cloneFrozenNode,
  deepCloneMap,
  LocalClassPath,
  Pin,
} from "@emrgen/carbon-core";
import { InlineNode } from "./InlineNode";
import { last } from "lodash";

// utility class for text blocks
// title is a text block
// a text block contains inline children like text, links, hashtags, mentions, etc
// when you type in a text block, you are typing in the inline content
// when merging text blocks, you are merging the inline content along with the content marks
export class TextBlock {
  private readonly node: Node;

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

  // merge adjacent text nodes with the same marks
  normalizeContent() {
    const { children } = this.node;

    return TextBlock.normalizeNodeContent(children, this.node);
  }

  static normalizeNodeContent(content: Node[], parent?: Node) {
    // merge adjacent text nodes with the same marks
    const nodes =
      content.reduce((acc, curr, index) => {
        // FIXME: this is a hack to remove the class from the title node
        // as
        if (parent?.name === "title") {
          curr.updateProps({ [LocalClassPath]: "" });
        }
        if (index === 0) {
          return [curr];
        }

        const prev = acc[acc.length - 1];
        const prevMarks = MarkSet.from(prev.marks);
        const currMarks = MarkSet.from(curr.marks);
        const prevClass = prev.props.get(LocalClassPath);
        const currClass = curr.props.get(LocalClassPath);
        if (
          prevMarks.eq(currMarks) &&
          prevClass === currClass &&
          !prev.isIsolate &&
          !curr.isIsolate
        ) {
          const prevClone = prev.clone();
          acc.pop();

          const newNodes = InlineNode.from(prev).merge(curr);

          acc.push(...newNodes);
          return acc;
        }

        return [...acc, curr];
      }, [] as Node[]) ?? [];

    const result = nodes.reduce((acc, curr, index) => {
      if (index === 0) {
        // if the first node is an inline atom wrapper, add an empty node before it
        if (this.isInlineAtomIsolate(curr)) {
          const empty = curr.type.schema.type("empty")?.default();
          if (!empty) {
            throw new Error("empty node not found");
          }
          return [empty, curr];
        }

        return [curr];
      }

      const prev = acc[acc.length - 1] as Node;

      // if both are empty nodes, skip the current node
      if (prev.isZero && curr.isZero) {
        return acc;
      }

      // if both are not inline atom wrappers, add an empty node between them
      if (this.isInlineAtomIsolate(prev) && this.isInlineAtomIsolate(curr)) {
        const empty = curr.type.schema.type("empty")?.default();
        if (!empty) {
          throw new Error("empty node not found");
        }
        return [...acc, empty, curr];
      }

      return [...acc, curr];
    }, [] as Node[]);

    if (result.length && this.isInlineAtomIsolate(last(result)!)) {
      const empty = last(result)?.type.schema.type("empty")?.default();
      if (!empty) {
        throw new Error("empty node not found");
      }
      return [...result, empty];
    }

    return result;
  }

  static isInlineAtomIsolate(node: Node) {
    return node.isIsolate && node.type.isInline && node.type.isAtom;
  }

  // remove content from a text block from a given range
  removeContent(from: number, to: number): Node[] {
    if (from === to) {
      return this.node.children;
    }
    console.log("x");

    const start = Pin.create(this.node, from);
    const end = Pin.create(this.node, to);
    const startDown = start.down().rightAlign;
    const endDown = end.down().leftAlign;
    const startNode = startDown.node.closest(
      (n) => n.parent?.isTextContainer!,
    )!;
    const endNode = endDown.node.closest((n) => n.parent?.isTextContainer!)!;

    console.log(startDown.node.id.toString(), endDown.node.id.toString());
    console.log(startNode.id.toString(), endNode.id.toString());
    if (startNode.eq(endNode)) {
      if (startNode.isInlineAtom) {
        return this.node.children.filter((n) => !n.eq(startNode));
      }

      const textContent =
        startNode.textContent.slice(0, startDown.offset) +
        endNode.textContent.slice(endDown.offset);
      const textNode = startNode.type.create(
        textContent,
        startNode.props.toJSON(),
      )!;

      return (
        this.node.children.map((child) => {
          if (child.eq(startNode)) {
            return textNode;
          }
          return child;
        }) ?? ([] as Node[])
      )
        .map(cloneFrozenNode)
        .filter((n) => n.focusSize);
    }

    const prevNodes = startNode.prevSiblings;
    const nextNodes = endNode.nextSiblings;
    let startNodes: Node[] = [];
    let endNodes: Node[] = [];

    if (startDown.node.isZero) {
      startNodes = [startDown.node];
    } else {
      startNodes = InlineNode.from(startDown.node).split(startDown.offset);
      if (startDown.offset !== startNode.focusSize) {
        startNodes.pop();
      }
    }

    if (endDown.node.isZero) {
      endNodes = [endDown.node];
    } else {
      endNodes = InlineNode.from(endDown.node).split(endDown.offset);
      if (endDown.offset !== 0) {
        endNodes.shift();
      }
    }

    return [...prevNodes, ...startNodes, ...endNodes, ...nextNodes]
      .map(cloneFrozenNode)
      .filter((n) => n.focusSize);
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

  toJSON() {
    return this.node.toJSON();
  }

  toString(): string {
    return classString(this)(this.node.toJSON());
  }
}
