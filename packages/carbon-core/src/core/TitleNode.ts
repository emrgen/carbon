import { Optional } from "@emrgen/types";
import { clamp, identity, last } from "lodash";
import { IndexMap, IndexMapper } from "./IndexMap";
import { InlineNode } from "./InlineNode";
import { classString } from "./Logger";
import { Mark, MarkSet } from "./Mark";
import { Node } from "./Node";
import { NodeContentData } from "./NodeContent";
import { LocalClassPath } from "./NodeProps";
import { Pin } from "./Pin";
import { Step, StepOffset } from "./Step";
import { cloneFrozenNode, Maps } from "./types";

// utility class for text blocks
// a text block contains inline children like text, links, hashtags, mentions, etc
// when you type in a text block, you are typing in the inline content
// when merging text blocks, you are merging the inline content along with the content marks
export class TitleNode {
  readonly node: Node;
  readonly startMapper: IndexMapper;
  readonly endMapper: IndexMapper;

  static from(node: Node) {
    console.log("before --------", node.toJSON());
    const clone = node.type.schema.factory.clone(node, identity);
    console.log("after --------", clone.toJSON());
    clone.setParent(null).setParentId(null);

    return new TitleNode(clone, IndexMapper.empty(), IndexMapper.empty());
  }

  static empty() {
    return new TitleNode(
      Node.IDENTITY,
      IndexMapper.empty(),
      IndexMapper.empty(),
    );
  }

  private constructor(
    node: Node,
    startMapper: IndexMapper = IndexMapper.empty(),
    endMapper: IndexMapper = IndexMapper.empty(),
  ) {
    if (!node.isTextContainer && !node.eq(Node.IDENTITY)) {
      console.error(node.toJSON());
      throw new Error("can not create text block from non text block node");
    }

    this.node = node;
    this.startMapper = startMapper;
    this.endMapper = endMapper;
  }

  get stepSize() {
    return this.node.stepSize;
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

  get children() {
    return this.node.children;
  }

  // split the content and return a new text block
  splitInp(offset: number) {
    if (offset <= 1 || offset >= this.node.stepSize - 1) {
      return this;
    }

    const down = Step.create(this.node, offset).down();

    if (down.isBefore || down.isAtEnd || down.isAtStart || down.isAfter) {
      return this;
    }

    // the offset falls within an inline node
    const { index } = down.node;

    const [before, after] = InlineNode.from(down.node).split(down.offset - 1);

    // printNode(before);
    // printNode(after);

    const prev = this.node.children.slice(0, index);
    const next = this.node.children.slice(index + 1);

    const children = [...prev, before, after, ...next];

    const startMapper = this.startMapper.clone();
    startMapper.add(IndexMap.create(offset + 1, 2));

    const endMapper = this.endMapper.clone();
    console.log(offset - 1 - this.node.stepSize, -2);
    endMapper.add(IndexMap.create(offset - 1 - this.node.stepSize, -2));

    return new TitleNode(
      this.cloneNode(this.node, children),
      startMapper,
      endMapper,
    );
  }

  insertInp(stepOffset: number, node: Node): TitleNode {
    if (stepOffset <= 1) {
      return this.prepend([node]);
    }

    if (stepOffset >= this.node.stepSize - 1) {
      return this.append([node]);
    }

    const down = Step.create(this.node, stepOffset).down();

    if (down.isBefore || down.isAtStart) {
      const { index } = down.node;
      const prev = this.node.children.slice(0, index);
      const next = this.node.children.slice(index);
      const children = [...prev, node, ...next];

      const startMapper = this.startMapper.clone();
      startMapper.add(
        IndexMap.create(stepOffset + (down.isAtStart ? 1 : 2), node.stepSize),
      );

      const endMapper = this.endMapper.clone();
      endMapper.add(
        IndexMap.create(
          stepOffset - (down.isAtStart ? 1 : 2) - 1 - this.node.stepSize,
          -node.stepSize,
        ),
      );

      return new TitleNode(
        this.cloneNode(this.node, children),
        startMapper,
        endMapper,
      );
    }

    if (down.isAfter || down.isAtEnd) {
      const { index } = down.node;
      const prev = this.node.children.slice(0, index + 1);
      const next = this.node.children.slice(index + 1);
      const children = [...prev, node, ...next];

      const startMapper = this.startMapper.clone();
      startMapper.add(
        IndexMap.create(stepOffset + (down.isAtEnd ? 1 : 2), node.stepSize),
      );

      const endMapper = this.endMapper.clone();
      endMapper.add(
        IndexMap.create(
          stepOffset - (down.isAtEnd ? 1 : 2) - 1 - this.node.stepSize,
          -node.stepSize,
        ),
      );

      return new TitleNode(
        this.cloneNode(this.node, children),
        startMapper,
        endMapper,
      );
    }

    return this.splitInp(stepOffset).insertInp(stepOffset + 1, node);
  }

  removeInp(from: number, to: number): TitleNode {
    if (from === to) {
      return this;
    }

    let d1 = Step.create(this.node, from).down();
    const d2 = Step.create(this.node, to).down();

    if (
      d1.node.eq(d2.node) &&
      (d1.isBefore || d1.isAtStart) &&
      (d2.isAfter || d2.isAtEnd)
    ) {
      const { index } = d1.node;
      const prev = this.node.children.slice(0, index);
      const next = this.node.children.slice(index + 1);
      const children = [...prev, ...next];

      const startMapper = this.startMapper.clone();
      console.log(from, -d1.node.stepSize);
      startMapper.add(IndexMap.create(from, -d1.node.stepSize));

      const endMapper = this.endMapper.clone();
      endMapper.add(
        IndexMap.create(to - this.node.stepSize - 1, d1.node.stepSize),
      );

      return new TitleNode(
        this.cloneNode(this.node, children),
        startMapper,
        endMapper,
      );
    }

    // delete after d1 upto d2
    if ((d1.isAfter || d1.isAtEnd) && (d2.isAfter || d2.isAtEnd)) {
      const { index: index1 } = d1.node;
      const { index: index2 } = d2.node;
      const prev = this.node.children.slice(0, index1 + 1);
      const next = this.node.children.slice(index2 + 1);
      const children = [...prev, ...next];
      const middle = this.node.children.slice(index1 + 1, index2 + 1);

      const stepSize = middle.reduce((acc, curr) => acc + curr.stepSize, 0);
      const startMapper = this.startMapper.clone();
      startMapper.add(IndexMap.create(from, -stepSize));

      const endMapper = this.endMapper.clone();
      endMapper.add(IndexMap.create(to - this.node.stepSize - 1, +stepSize));

      return new TitleNode(
        this.cloneNode(this.node, children),
        startMapper,
        endMapper,
      );
    }

    if ((d1.isAfter || d1.isAtEnd) && (d2.isBefore || d2.isAtStart)) {
      const { index: index1 } = d1.node;
      const { index: index2 } = d2.node;
      const prev = this.node.children.slice(0, index1 + 1);
      const next = this.node.children.slice(index2);
      const children = [...prev, ...next];
      const middle = this.node.children.slice(index1 + 1, index2);

      const stepSize = middle.reduce((acc, curr) => acc + curr.stepSize, 0);
      const startMapper = this.startMapper.clone();
      startMapper.add(IndexMap.create(from, -stepSize));

      const endMapper = this.endMapper.clone();
      endMapper.add(IndexMap.create(to - this.node.stepSize - 1, +stepSize));

      return new TitleNode(
        this.cloneNode(this.node, children),
        startMapper,
        endMapper,
      );
    }

    if ((d1.isBefore || d1.isAtStart) && (d2.isBefore || d2.isAtStart)) {
      const { index: index1 } = d1.node;
      const { index: index2 } = d2.node;
      const prev = this.node.children.slice(0, index1);
      const next = this.node.children.slice(index2);
      const children = [...prev, ...next];
      const middle = this.node.children.slice(index1, index2);

      const stepSize = middle.reduce((acc, curr) => acc + curr.stepSize, 0);
      const startMapper = this.startMapper.clone();
      startMapper.add(IndexMap.create(from, -stepSize));

      const endMapper = this.endMapper.clone();
      endMapper.add(IndexMap.create(to - this.node.stepSize - 1, +stepSize));

      return new TitleNode(
        this.cloneNode(this.node, children),
        startMapper,
        endMapper,
      );
    }

    if ((d1.isBefore || d1.isAtStart) && (d2.isAfter || d2.isAtEnd)) {
      const { index: index1 } = d1.node;
      const { index: index2 } = d2.node;
      const prev = this.node.children.slice(0, index1);
      const next = this.node.children.slice(index2 + 1);
      const children = [...prev, ...next];
      const middle = this.node.children.slice(index1, index2 + 1);

      const stepSize = middle.reduce((acc, curr) => acc + curr.stepSize, 0);
      const startMapper = this.startMapper.clone();
      startMapper.add(IndexMap.create(from, -stepSize));

      const endMapper = this.endMapper.clone();
      endMapper.add(IndexMap.create(to - this.node.stepSize - 1, +stepSize));

      return new TitleNode(
        this.cloneNode(this.node, children),
        startMapper,
        endMapper,
      );
    }

    const title = this.splitInp(to).splitInp(from);
    const newFrom = title.mapStep(from);
    const newTo = title.mapStep(to); //title.node.stepSize + title.mapStep(to - this.node.stepSize);

    return title.removeInp(newFrom, newTo);
  }

  // ------------------------------

  intoContent() {
    return this.node.unwrap();
  }

  // mapStep maps the original location to the current location after the text block has been modified
  mapStep(step: number): number {
    if (step >= 0) {
      return this.startMapper.map(IndexMap.DEFAULT, step);
    } else {
      return this.endMapper.map(IndexMap.DEFAULT, step);
    }
  }

  // the steps are used to find the new location of the pin after the text block has been modified
  // the pin is used to represent the cursor position in the text block
  mapPin(pin: Pin): Optional<Pin> {
    const down = pin.down();
    let steps = pin.steps;
    // if the focus is on the right side of the node,
    // the steps should be reduced by 1 to put the focus at the start of the zero node
    if (down.node.isZero && down.offset === 1) {
      steps -= 1;
    }

    const { node } = this;
    if (node.isTextContainer && node.isVoid) {
      return Pin.create(node, 0, 1);
    }

    steps = clamp(steps, 1, this.node.stepSize - 2);

    return Step.create(node, steps).down().pin()?.up();
  }

  mark(from: number, to: number, mark: Mark) {
    return this;
  }

  replaceContent(content: Node[]) {
    return TitleNode.from(this.cloneNode(this.node, content));
  }

  // remove content from a text block from a given range
  remove(from: StepOffset, to: StepOffset): TitleNode {
    const [prev, middle, next] = this.split(from, to);

    // console.log(prev.textContent, middle.textContent, next.textContent);

    // split at the start and end of the range
    // remove the content between the split
    const children = [...prev.node.children, ...next.node.children];
    const node = this.cloneNode(this.node, children);

    return TitleNode.from(node);
  }

  // split a text block at a given range and return the new text blocks
  split(start: StepOffset): [TitleNode, TitleNode, TitleNode];
  split(start: StepOffset, end: StepOffset): [TitleNode, TitleNode, TitleNode];
  split(
    start: StepOffset,
    end?: StepOffset,
  ): [TitleNode, TitleNode, TitleNode] {
    if (end) {
      const [prev, next] = this.split(end);
      if (!prev.node.eq(Node.IDENTITY)) {
        const [first, second] = prev.split(start);
        // console.log(
        //   "xxxx",
        //   first.textContent,
        //   second.textContent,
        //   next.textContent,
        // );
        return [first, second, next];
      } else {
        return [TitleNode.empty(), TitleNode.empty(), next];
      }
    }

    if (start <= 1) {
      return [TitleNode.empty(), this.clone(), TitleNode.empty()];
    }

    if (start >= this.node.stepSize - 1) {
      return [this.clone(), TitleNode.empty(), TitleNode.empty()];
    }

    if (this.node.isVoid) {
      return [this.clone(), this.clone(), TitleNode.empty()];
    }

    const down = Step.create(this.node, start).down();
    if ((down.isAtStart || down.isAtEnd) && down.node.parent?.eq(this.node)) {
      const { index } = down.node;
      const atStart = down.isAtStart;
      const prev = this.node.children.slice(0, index + (atStart ? 0 : 1));
      const next = this.node.children.slice(index + (atStart ? 0 : 1));

      const prevNode = this.cloneNode(this.node, prev);
      const nextNode = this.cloneNode(this.node, next);

      const prevMapper = this.startMapper.clone();
      prevMapper.add(
        IndexMap.create(
          start,
          prevNode.children.reduce((acc, curr) => acc - curr.stepSize, 0),
        ),
      );
      const nextMapper = this.startMapper.clone();
      nextMapper.add(
        IndexMap.create(
          start,
          nextNode.children.reduce((acc, curr) => acc - curr.stepSize, 0),
        ),
      );

      // console.log(prevNode.textContent, "-", nextNode.textContent);

      return [
        new TitleNode(prevNode, prevMapper),
        new TitleNode(nextNode, nextMapper),
        TitleNode.empty(),
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

    const prevNode = this.cloneNode(
      this.node,
      [...prev, before].filter(identity),
    );
    const nextNode = this.cloneNode(
      this.node,
      [after, ...next].filter(identity) as Node[],
    );

    const prevMapper = this.startMapper.clone();
    const nextMapper = this.startMapper.clone();

    prevMapper.add(
      IndexMap.create(
        start,
        prevNode.children.reduce(
          (acc, curr) => acc - curr.stepSize,
          before.stepSize,
        ),
      ),
    );

    if (after) {
      nextMapper.add(
        IndexMap.create(
          start,
          nextNode.children.reduce(
            (acc, curr) => acc - curr.stepSize,
            after.stepSize,
          ),
        ),
      );
    }

    // console.log("xxx", prevNode.toJSON(), prevNode.isTextContainer);
    // console.log("xxx", nextNode.toJSON(), nextNode.isTextContainer);

    return [
      new TitleNode(prevNode, prevMapper),
      new TitleNode(nextNode, nextMapper),
      TitleNode.empty(),
    ];
  }

  // insert content into a text block at a given range
  insert(at: StepOffset, nodes: Node | Node[]): TitleNode {
    const content = Array.isArray(nodes) ? nodes : [nodes];
    const stepSize = content.reduce((acc, curr) => acc + curr.stepSize, 0);

    // check if the target offset is at the start of the text block
    if (0 < at && at <= 2) {
      const mapper = this.startMapper.clone();
      mapper.add(IndexMap.create(at, stepSize));
      const children = [...content, ...this.node.children];
      const node = this.cloneNode(this.node, children);

      return new TitleNode(node, mapper);
    }

    if (this.node.stepSize - 2 <= at && at < this.node.stepSize) {
      const mapper = this.startMapper.clone();
      mapper.add(IndexMap.create(at, stepSize));
      const children = [...this.node.children, ...content];
      const node = this.cloneNode(this.node, children);

      return new TitleNode(node, mapper);
    }

    const down = Step.create(this.node, at).down();
    if (down.isBefore || (down.isAtStart && down.node.parent?.eq(this.node))) {
      const { index } = down.node;
      const prev = this.node.children.slice(0, index);
      const next = this.node.children.slice(index);

      const children = [...prev, ...content, ...next];
      const node = this.cloneNode(this.node, children);

      const mapper = this.startMapper.clone();
      mapper.add(IndexMap.create(at + 1, stepSize));
      return new TitleNode(node, mapper);
    }

    if ((down.isAfter || down.isAtEnd) && down.node.parent?.eq(this.node)) {
      const { index } = down.node;
      const prev = this.node.children.slice(0, index + 1);
      const next = this.node.children.slice(index + 1);

      const children = [...prev, ...content, ...next];
      const node = this.cloneNode(this.node, children);

      const mapper = this.startMapper.clone();
      mapper.add(IndexMap.create(at, stepSize));
      return new TitleNode(node, mapper);
    }

    // check if the target offset is within an inline node
    // split the inline node at the target offset and insert the content
    const { index } = down.node;
    const prev = this.node.children.slice(0, index);
    const next = this.node.children.slice(index + 1);
    const [before, after] = InlineNode.from(down.node).split(down.offset - 1);

    const children = [...prev, before, ...content, after, ...next];
    const node = this.cloneNode(this.node, children);

    const mapper = this.startMapper.clone();
    mapper.add(IndexMap.create(at + 1, 2));
    mapper.add(IndexMap.create(at + 1, stepSize));

    return new TitleNode(node, mapper);
  }

  normalize(): TitleNode {
    const { children } = this.node;
    // const children = this.normalizeContent();
    // const node = this.cloneNode(this.node, children);
    // return new TitleNode(node, this.startMapper.clone());
    return this.normalizeMarks().normalizeInlineEmpty();
  }

  // merge adjacent text nodes with the same marks and update the index mapper
  normalizeMarks() {
    console.log(
      "normalize marks",
      this.children.map((n) => n.toJSON()),
    );
    const startMapper = this.startMapper.clone();
    const endMapper = this.endMapper.clone();
    const parent = this.node;

    let offset = 2;

    const nodes =
      this.children.reduce((acc, curr, index) => {
        // FIXME: this is a hack to remove the class from the title node
        if (parent?.name === "title" && !curr.isZero && !curr.isInlineAtom) {
          curr.updateProps({ [LocalClassPath]: "" });
        }

        if (index === 0) {
          offset += curr.stepSize;
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
          !curr.isIsolate &&
          !curr.isInlineAtom
        ) {
          acc.pop();

          const newNodes = InlineNode.from(prev).merge(curr);
          // the steps after the merged nodes should be reduced by the 2 step size
          startMapper.add(IndexMap.create(offset, -2));
          // from end the steps should be reduced by 2 step size
          endMapper.add(IndexMap.create(offset - parent.stepSize - 1, 2));

          acc.push(...newNodes);
          offset += curr.stepSize;

          return acc;
        }

        offset += curr.stepSize;
        return [...acc, curr];
      }, [] as Node[]) ?? [];

    return new TitleNode(
      this.cloneNode(this.node, nodes),
      startMapper,
      endMapper,
    );
  }

  normalizeInlineEmpty() {
    const normalize = () => {
      const result = this.node.children.reduce((acc, curr, index) => {
        if (index === 0) {
          // if the first node is an inline atom wrapper, add an empty node before it
          if (TitleNode.isNonFocusableInlineAtom(curr)) {
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
        if (curr.isZero && (prev.isZero || prev.isFocusable)) {
          return acc;
        }

        // if the previous node is an empty node and the current node is focusable,
        // replace the empty node with the current node
        if (prev.isZero && curr.isFocusable) {
          return [...acc.slice(0, -1), curr];
        }

        // if both are not inline atom wrappers, add an empty node between them
        if (
          TitleNode.isNonFocusableInlineAtom(prev) &&
          TitleNode.isNonFocusableInlineAtom(curr)
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
          !TitleNode.isNonFocusableInlineAtom(secondLastNode) &&
          lastNode.isZero
        ) {
          return result.slice(0, -1);
        }

        if (result.length === 1 && lastNode.isZero) {
          return [];
        }

        if (TitleNode.isNonFocusableInlineAtom(lastNode)) {
          const empty = last(result)?.type.schema.type("empty")?.default();
          if (!empty) {
            throw new Error("empty node not found");
          }
          return [...result, empty];
        }
      }
      return result;
    };

    return new TitleNode(
      this.cloneNode(this.node, normalize()),
      this.startMapper,
      this.endMapper,
    );
  }

  // clone node with new children
  private cloneNode(node: Node, children: Node[]): Node {
    const clone = node.clone((data) => ({
      ...data,
      children,
    }));

    children.forEach((child) => {
      child.setParent(clone).setParentId(clone.id);
    });

    return clone;
  }

  // --------------------------------

  // merge adjacent text nodes with the same marks
  normalizeContent() {
    const { children } = this.node;

    return TitleNode.normalizeNodeContent(children, this.node);
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
      if (curr.isZero && (prev.isZero || prev.isFocusable)) {
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

  clone(
    map: Maps<
      Omit<NodeContentData, "children">,
      Omit<NodeContentData, "children">
    > = identity,
  ) {
    return new TitleNode(
      this.node.type.schema.factory.clone(this.node, map),
      this.startMapper.clone(),
    );
  }

  resetMapper() {
    return new TitleNode(this.node, IndexMapper.empty());
  }

  append(node: Node[]) {
    const children = [...this.node.children, ...node];
    const stepSize = node.reduce((acc, curr) => acc + curr.stepSize, 0);

    const startMapper = this.startMapper.clone();
    startMapper.add(IndexMap.create(this.stepSize + 1, stepSize));

    const endMapper = this.endMapper.clone();
    endMapper.add(IndexMap.create(-2 - 1, -stepSize));

    return new TitleNode(
      this.cloneNode(this.node, children),
      startMapper,
      endMapper,
    );
  }

  private prepend(node: Node[]) {
    const children = [...node, ...this.node.children];
    const stepSize = node.reduce((acc, curr) => acc + curr.stepSize, 0);

    const startMapper = this.startMapper.clone();
    startMapper.add(IndexMap.create(2, stepSize));

    const endMapper = this.endMapper.clone();
    endMapper.add(IndexMap.create(2 - this.stepSize - 1, -stepSize));

    return new TitleNode(
      this.cloneNode(this.node, children),
      startMapper,
      endMapper,
    );
  }
}
