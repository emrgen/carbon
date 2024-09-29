import { classString } from "./Logger";
import { MarkSet } from "./Mark";
import { Node } from "./Node";
import { InlineNode } from "./InlineNode";
import { last } from "lodash";
import { identity } from "lodash";
import { deepCloneMap } from "./types";
import { cloneFrozenNode } from "./types";
import { Pin } from "./Pin";
import { LocalClassPath } from "./NodeProps";
import { StepOffset } from "./Step";
import { Step } from "./Step";
import { IndexMapper } from "./IndexMap";
import { IndexMap } from "./IndexMap";

// utility class for text blocks
// title is a text block
// a text block contains inline children like text, links, hashtags, mentions, etc
// when you type in a text block, you are typing in the inline content
// when merging text blocks, you are merging the inline content along with the content marks
export class TextBlock {
  private readonly node: Node;
  private readonly mapper: IndexMapper;

  static from(node: Node) {
    const clone = node.clone(deepCloneMap);

    return new TextBlock(clone, IndexMapper.empty());
  }

  static empty() {
    return new TextBlock(Node.IDENTITY, IndexMapper.empty());
  }

  private constructor(node: Node, mapper: IndexMapper) {
    if (!node.isTextContainer && !node.eq(Node.IDENTITY)) {
      console.error(node.toJSON());
      throw new Error("can not create text block from non text block node");
    }

    this.node = node;
    this.mapper = mapper;
  }

  get isDefault() {
    return this.node.eq(Node.IDENTITY);
  }

  get type() {
    return this.node.type;
  }

  get textContent() {
    return this.node.textContent;
  }

  intoContent() {
    return this.node.unwrap();
  }

  // mapStep maps the original location to the current location after the text block has been modified
  mapStep(from: number): number {
    return this.mapper.map(IndexMap.DEFAULT, from);
  }

  // remove content from a text block from a given range
  remove(from: StepOffset, to: StepOffset): TextBlock {
    // split at the start and end of the range
    // remove the content between the split
    return this;
  }

  // split a text block at a given range and return the new text blocks
  split(start: StepOffset): [TextBlock, TextBlock, TextBlock];
  split(start: StepOffset, end: StepOffset): [TextBlock, TextBlock, TextBlock];
  split(
    start: StepOffset,
    end?: StepOffset,
  ): [TextBlock, TextBlock, TextBlock] {
    if (end) {
      const [prev, next] = this.split(end);
      if (!prev.node.eq(Node.IDENTITY)) {
        const [first, second] = prev.split(start);
        return [first, second, next];
      } else {
        return [TextBlock.empty(), TextBlock.empty(), next];
      }
    }

    if (this.node.isVoid) {
      return [this.clone(), this.clone(), TextBlock.empty()];
    }

    const down = Step.create(this.node, start).down();
    if ((down.isAtStart || down.isAtEnd) && down.node.parent?.eq(this.node)) {
      const { index } = down.node;
      const prev = this.node.children.slice(0, index + 1);
      const next = this.node.children.slice(index + 1);

      const prevNode = this.node.clone((data) => {
        return {
          ...data,
          children: prev,
        };
      });

      const nextNode = this.node.clone((data) => {
        return {
          ...data,
          children: next,
        };
      });

      const prevMapper = this.mapper.clone();
      prevMapper.add(
        IndexMap.create(
          start,
          prevNode.children.reduce((acc, curr) => acc - curr.stepSize, 0),
        ),
      );
      const nextMapper = this.mapper.clone();
      nextMapper.add(
        IndexMap.create(
          start,
          nextNode.children.reduce((acc, curr) => acc - curr.stepSize, 0),
        ),
      );

      return [
        new TextBlock(prevNode, prevMapper),
        new TextBlock(nextNode, nextMapper),
        TextBlock.empty(),
      ];
    }

    // the offset is within an inline node, the inline node should be split
    if (!down.node.parent?.eq(this.node)) {
      throw new Error("split target not found");
    }

    const { index } = down.node;
    const prev = this.node.children.slice(0, index);
    const next = this.node.children.slice(index + 1);
    const [before, after] = InlineNode.from(down.node).split(down.offset - 1);

    const prevNode = this.node.clone((data) => {
      return {
        ...data,
        children: [...prev, before],
      };
    });

    const nextNode = this.node.clone((data) => {
      return {
        ...data,
        children: [after, ...next],
      };
    });

    const prevMapper = this.mapper.clone();
    const nextMapper = this.mapper.clone();

    prevMapper.add(
      IndexMap.create(
        start,
        prevNode.children.reduce(
          (acc, curr) => acc - curr.stepSize,
          before.stepSize,
        ),
      ),
    );

    nextMapper.add(
      IndexMap.create(
        start,
        nextNode.children.reduce(
          (acc, curr) => acc - curr.stepSize,
          after.stepSize,
        ),
      ),
    );

    // console.log("xxx", prevNode.toJSON(), prevNode.isTextContainer);
    // console.log("xxx", nextNode.toJSON(), nextNode.isTextContainer);

    return [
      new TextBlock(prevNode, prevMapper),
      new TextBlock(nextNode, nextMapper),
      TextBlock.empty(),
    ];
  }

  // insert content into a text block at a given range
  insert(at: StepOffset, nodes: Node | Node[]): TextBlock {
    const content = Array.isArray(nodes) ? nodes : [nodes];
    const stepSize = content.reduce((acc, curr) => acc + curr.stepSize, 0);

    // check if the target offset is at the start of the text block
    if (0 < at && at <= 2) {
      const mapper = this.mapper.clone();
      mapper.add(IndexMap.create(at, stepSize));
      const children = [...content, ...this.node.children];
      const node = this.node.clone((data) => {
        return {
          ...data,
          children,
        };
      });
      children.forEach((child) => {
        child.setParent(node).setParentId(node.id);
      });
      return new TextBlock(node, mapper);
    }

    if (this.node.stepSize - 2 <= at && at < this.node.stepSize) {
      const mapper = this.mapper.clone();
      mapper.add(IndexMap.create(at, stepSize));
      const children = [...this.node.children, ...content];
      const node = this.node.clone((data) => {
        return {
          ...data,
          children,
        };
      });
      children.forEach((child) => {
        child.setParent(node).setParentId(node.id);
      });

      return new TextBlock(node, mapper);
    }

    const down = Step.create(this.node, at).down();
    if ((down.isAtStart || down.isAtEnd) && down.node.parent?.eq(this.node)) {
      const mapper = this.mapper.clone();
      mapper.add(IndexMap.create(at, stepSize));
      const { index } = down.node;
      const prev = this.node.children.slice(0, index + 1);
      const next = this.node.children.slice(index + 1);

      const children = [...prev, ...content, ...next];
      const node = this.node.clone((data) => {
        return {
          ...data,
          children,
        };
      });

      children.forEach((child) => {
        child.setParent(node).setParentId(node.id);
      });

      return new TextBlock(node, mapper);
    }

    // check if the target offset is within an inline node
    // split the inline node at the target offset and insert the content
    const { index } = down.node;
    const prev = this.node.children.slice(0, index);
    const next = this.node.children.slice(index + 1);
    const [before, after] = InlineNode.from(down.node).split(down.offset - 1);

    const children = [...prev, before, ...content, after, ...next];
    const node = this.node.clone((data) => {
      return {
        ...data,
        children,
      };
    });

    children.forEach((child) => {
      child.setParent(node).setParentId(node.id);
    });

    const mapper = this.mapper.clone();
    mapper.add(IndexMap.create(at + 1, stepSize));

    return new TextBlock(node, mapper);
  }

  normalize(): TextBlock {
    return this;
  }

  // --------------------------------

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
        if (this.isNonFocusableInlineAtom(curr)) {
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

      // if the previous node is an empty node and the current node is focusable,
      // replace the empty node with the current node
      if (prev.isZero && curr.isFocusable) {
        return [...acc.slice(0, -1), curr];
      }

      // if both are not inline atom wrappers, add an empty node between them
      if (
        this.isNonFocusableInlineAtom(prev) &&
        this.isNonFocusableInlineAtom(curr)
      ) {
        const empty = curr.type.schema.type("empty")?.default();
        if (!empty) {
          throw new Error("empty node not found");
        }
        return [...acc, empty, curr];
      }

      return [...acc, curr];
    }, [] as Node[]);

    if (result.length) {
      const lastNode = last(result)!;
      const secondLastNode = result[result.length - 2];
      if (
        secondLastNode &&
        !this.isNonFocusableInlineAtom(secondLastNode) &&
        lastNode.isZero
      ) {
        return result.slice(0, -1);
      }

      if (result.length === 1 && lastNode.isZero) {
        return [];
      }

      if (this.isNonFocusableInlineAtom(lastNode)) {
        const empty = last(result)?.type.schema.type("empty")?.default();
        if (!empty) {
          throw new Error("empty node not found");
        }
        return [...result, empty];
      }
    }

    return result;
  }

  static isNonFocusableInlineAtom(node: Node) {
    return node.type.isInline && node.type.isAtom && !node.isFocusable;
  }

  // remove content from a text block from a given range
  removeContent(from: number, to: number): Node[] {
    if (from === to) {
      return this.node.children;
    }

    if (from === 0 && to === this.node.focusSize) {
      return [];
    }

    const start = Pin.create(this.node, from);
    const end = Pin.create(this.node, to);
    const startDown = start.down()?.rightAlign;
    const endDown = end.down()?.leftAlign;
    const startNode = startDown?.node.closest(
      (n) => n.parent?.isTextContainer!,
    )!;
    const endNode = endDown?.node.closest((n) => n.parent?.isTextContainer!)!;

    console.log(startDown?.node.id.toString(), endDown?.node.id.toString());
    console.log(startNode.id.toString(), endNode.id.toString());
    if (startNode.eq(endNode)) {
      if (startNode.isInlineAtom) {
        return this.node.children.filter((n) => !n.eq(startNode));
      }

      const textContent =
        startNode.textContent.slice(0, startDown?.offset) +
        endNode.textContent.slice(endDown?.offset);
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
        .filter((n) => {
          return !(n.isText && n.size === 0);
        });
    }

    const prevNodes = startNode.prevSiblings;
    const nextNodes = endNode.nextSiblings;
    let startNodes: Node[] = [];
    let endNodes: Node[] = [];

    if (startDown?.node.isZero) {
      startNodes = [startDown.node];
    } else {
      startNodes = InlineNode.from(startDown?.node).split(startDown?.offset);
      if (startDown.offset !== startNode.focusSize) {
        startNodes.pop();
      }
    }

    if (endDown?.node.isZero) {
      endNodes = [endDown.node];
    } else {
      endNodes = InlineNode.from(endDown?.node).split(endDown.offset);
      if (endDown.offset !== 0) {
        endNodes.shift();
      }
    }
    console.log([...prevNodes, ...startNodes, ...endNodes, ...nextNodes]);

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

  private clone() {
    return new TextBlock(
      this.node.type.schema.factory.clone(this.node, identity),
      this.mapper.clone(),
    );
  }
}
