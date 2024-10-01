import {
  CarbonAction,
  EventContext,
  EventHandler,
  EventHandlerMap,
  InlineNode,
  LocalClassPath,
  Mark,
  MarksPath,
  Node,
  NodeEncoder,
  PluginManager,
  preventAndStopCtx,
  SetContentAction,
  TextBlock,
  Writer,
} from "@emrgen/carbon-core";
import prism from "prismjs";
import { Optional } from "@emrgen/types";
import { cloneDeep, identity, uniq } from "lodash";
import { diffArrays } from "diff";
import "prismjs/components/prism-go";
import { TitlePlugin } from "./Title";

export class CodeTitle extends TitlePlugin {
  name = "codeTitle";

  override spec() {
    return {
      ...super.spec(),
      tag: "code",
      code: true,
    };
  }

  override handlers(): EventHandlerMap {
    return {
      beforeInput: (ctx) => {
        preventAndStopCtx(ctx);
        const { app, cmd, event } = ctx;
        const { selection } = app.state;
        // @ts-ignore
        const { data, key } = event.nativeEvent;
        const { start } = selection;
        cmd.transform.insertText(selection, data ?? key, false)?.Dispatch();
      },
    };
  }

  override keydown(): Partial<EventHandler> {
    return {
      enter: (ctx: EventContext<any>) => {
        const { app, currentNode } = ctx;
        const { selection } = ctx.app.state;
        // insert a new line into the title
        if (selection.isCollapsed) {
          preventAndStopCtx(ctx);
          const { start } = selection;
          // to keep the tabbing consistent, check if last line prefix space count
          const { textContent } = currentNode;
          const beforeCursor = textContent.slice(0, start.offset);
          const lastLine = beforeCursor.split("\n").pop();
          const prefixSpace = lastLine?.match(/^\s*/)?.[0]?.length || 0;
          app.cmd.transform
            .insertText(selection, "\n" + " ".repeat(prefixSpace))
            ?.Dispatch();
        }
      },
      tab: (ctx: EventContext<any>) => {
        const { app } = ctx;
        const { selection } = ctx.app.state;
        // insert a tab into the title
        if (selection.isCollapsed) {
          preventAndStopCtx(ctx);
          const { start } = selection;
          // use 2 spaces for tabbing
          app.cmd.transform.insertText(selection, `  `)?.Dispatch();
        }
      },
    };
  }

  encode(w: Writer, ne: NodeEncoder, node: Node) {
    w.write(node.textContent);
  }

  encodeHtml(w: Writer, ne: NodeEncoder, node: Node) {
    w.write("<code>");
    w.write(node.textContent);
    w.write("</code>");
  }

  // add token class to the text nodes for syntax highlighting
  // merge adjacent text nodes with the same marks and token class
  override sanitize(node: Node, pm: PluginManager): Optional<Node> {
    const content = CodeTitle.highlightContent(node).map((child) =>
      child.clone().setParentId(node.id),
    );
    const sanitized = node.clone((data) => ({
      ...data,
      children: content,
    }));

    if (TextBlock.isSimilarContent(node.children, sanitized.children)) {
      return node;
    }

    return sanitized;
  }

  override normalize(node: Node): CarbonAction[] {
    const content = CodeTitle.highlightContent(node);
    //
    if (TextBlock.isSimilarContent(node.children, content)) {
      return [];
    }

    return [SetContentAction.withBefore(node, node.children, content)];
  }

  static highlightContent(node: Node): Node[] {
    const { marks, textContent } = CodeTitle.segregate(node);
    const tokens = CodeTitle.tokenize(textContent, "go");
    const markLightTokens = CodeTitle.applyTokenMarks(
      textContent,
      tokens,
      marks,
    );

    // console.log(markLightTokens);
    // console.log(marks, textContent);

    // NOTE:
    // get a diff if old and new tokens, if same return the old node content
    // if some text node is changed, return old node content nodes with the new text nodes
    const changes = diffArrays(
      node.children as NodeToken[],
      markLightTokens as NodeToken[],
      {
        comparator: compareTextContentNode,
      },
    );
    // console.log("CHANGES", changes);

    const merged = mergeDiff(
      changes,
      node.children as NodeToken[],
      markLightTokens,
    );
    // console.log("MERGED", merged);

    const { schema } = node.type;
    return merged
      .map((n) => {
        if (n instanceof Node) {
          return n;
        }

        return schema.text(n.content, {
          props: {
            [MarksPath]: n.marks.map((m) => m.toJSON()),
            [LocalClassPath]: `token ${n.token}`,
          },
        });
      })
      .filter(identity) as Node[];
  }

  static applyTokenMarks(
    textContent: string,
    tokens: HighlightToken[],
    marks: MarkToken[],
  ): MarkLightToken[] {
    // split the textContent into tokens of non overlapping marks and highlights
    const ret: MarkLightToken[] = [];

    // split the tokens at marks start, end offsets
    const offsets = uniq(
      marks.reduce((acc, mark) => {
        const { start, end } = mark;
        return [...acc, start, end];
      }, [] as number[]),
    );

    // console.log(marks, offsets);

    const tempTokens = cloneDeep(tokens);
    const splitTokens: HighlightToken[] = [];
    let markIndex = 0;
    for (let i = 0; i < tempTokens.length; i++) {
      const token = tokens[i];
      let { start, end } = token;
      while (markIndex < offsets.length) {
        const markOffset = offsets[markIndex];
        if (markOffset <= start) {
          markIndex++;
          continue;
        }
        // if markOffset is within the token split the token
        if (markOffset >= start && markOffset <= end) {
          const split = {
            ...token,
            id: generateShortId(),
            content: textContent.slice(start, markOffset),
            start,
            end: markOffset,
          };
          splitTokens.push(split);
          start = markOffset;
        }
        if (end <= markOffset) {
          break;
        }
        markIndex++;
      }

      if (start < end) {
        splitTokens.push({
          ...token,
          id: generateShortId(),
          content: textContent.slice(start, end),
          start,
          end,
        });
      }

      // console.log("tokenIndex", i, "markIndex", markIndex);
    }

    // console.log(splitTokens, marks);

    let tokenIndex = 0;
    let marksIndex = 0;
    while (tokenIndex < splitTokens.length) {
      const token = splitTokens[tokenIndex];
      while (marksIndex < marks.length) {
        const mark = marks[marksIndex];
        // if token is after mark
        if (mark.end <= token.start) {
          marksIndex++;
          continue;
        }

        // if token is within mark
        if (mark.start <= token.start && token.end <= mark.end) {
          ret.push({
            id: token.id!,
            content: token.content,
            token: token.type,
            marks: mark.marks,
            start: token.start,
            end: token.end,
          });
        }

        break;
      }

      // if no mark is found for the token
      if (ret[ret.length - 1]?.id !== token.id) {
        ret.push({
          id: token.id!,
          content: token.content,
          token: token.type,
          marks: [],
          start: token.start,
          end: token.end,
        });
      }

      tokenIndex++;

      // console.log("tokenIndex", tokenIndex, "marksIndex", marksIndex);
    }

    // console.log(ret);

    return ret;
  }

  static segregate(node: Node) {
    const textContent = node.textContent;
    const textNodes: Node[] = [];
    node.descendants().forEach((descendant) => {
      if (descendant.isText) {
        textNodes.push(descendant);
      }
    });

    const marks = textNodes.reduce(
      (acc, child) => {
        const { marks, offset } = acc;
        const nodeMarks = child.marks;
        // console.log(child.textContent, child.name, nodeMarks);
        if (nodeMarks.length) {
          return {
            marks: [
              ...marks,
              {
                marks: nodeMarks,
                start: offset,
                end: offset + child.textContent.length,
              },
            ],
            offset: offset + child.textContent.length,
          };
        }

        return {
          marks,
          offset: offset + child.textContent.length,
        };
      },
      {
        marks: [] as MarkToken[],
        offset: 0,
      },
    ).marks;

    return { textContent, marks };
  }

  static tokenize(textContent: string, language: string = "") {
    // console.log("text content", `"${textContent}"`);
    // console.log(prism.tokenize(textContent, prism.languages[language]));

    return prism.tokenize(textContent, prism.languages[language]).reduce(
      (acc, tok) => {
        const { tokens, offset } = acc;
        if (typeof tok === "string") {
          if (tok.trim() === "") {
            return {
              tokens: [
                ...tokens,
                {
                  content: tok,
                  type: "whitespace",
                  start: offset,
                  end: offset + tok.length,
                },
              ],
              offset: offset + tok.length,
            };
          }

          return {
            tokens: [
              ...tokens,
              {
                content: tok,
                type: "text",
                start: offset,
                end: offset + tok.length,
              },
            ],
            offset: offset + tok.length,
          };
        }

        return {
          tokens: [
            ...acc.tokens,
            {
              content: tok.content.toString(),
              type: tok.type,
              start: offset,
              end: offset + tok.content.length,
            },
          ],
          offset: offset + tok.content.length,
        };
      },
      {
        tokens: [] as HighlightToken[],
        offset: 0,
      },
    ).tokens;
  }
}

interface MarkLightToken {
  id: string;
  content: string;
  token: string;
  marks: Mark[];
  start: number;
  end: number;
}

interface HighlightToken {
  id?: string;
  content: string;
  type: string;
  start: number;
  end: number;
}

interface MarkToken {
  marks: Mark[];
  start: number;
  end: number;
}

// alpha-numeric characters with 10 digits
const generateShortId = () => Math.random().toString(36).slice(2, 12);

type NodeToken = Node | MarkLightToken;

const compareNodeToken = (a: Node, b: MarkLightToken) => {
  if (a.textContent !== b.content) {
    return false;
  }

  if (a.marks.length !== b.marks.length) {
    return false;
  }

  for (let i = 0; i < a.marks.length; i++) {
    if (a.marks[i].name !== b.marks[i].name) {
      return false;
    }
  }

  return a.props.get(LocalClassPath) === `token ${b.token}`;
};

const compareMarkLightToken = (a: MarkLightToken, b: MarkLightToken) => {
  return a.content === b.content && a.token === b.token;
};

const compareTextContentNode = (a, b) => {
  if (a instanceof Node && b instanceof Node) {
    return InlineNode.isSimilar(a, b);
  }

  if (a instanceof Node) {
    return compareNodeToken(a, b as MarkLightToken);
  }

  if (b instanceof Node) {
    return compareNodeToken(b, a as MarkLightToken);
  }

  return compareMarkLightToken(a, b);
};

export const mergeDiff = (diff: any[], prev: any[], next: any[]) => {
  let prevIndex = 0;
  let nextIndex = 0;
  const result: any[] = [];
  for (const part of diff) {
    if (part.added) {
      for (const value of part.value) {
        result.push(value);
      }
      nextIndex += part.value.length;
      continue;
    }

    if (part.removed) {
      prevIndex += part.value.length;
      continue;
    }

    for (const value of part.value) {
      const prevValue = prev[prevIndex];
      // const nextValue = next[nextIndex];
      if (prevValue) {
        result.push(prevValue);
      } else {
        result.push(value);
      }

      prevIndex++;
      nextIndex++;
    }
  }

  return result;
};
