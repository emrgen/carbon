import { TitlePlugin } from "@emrgen/carbon-blocks";
import {
  CarbonAction,
  CodeTokenClassPath,
  EventContext,
  EventHandler,
  EventHandlerMap,
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

import "prismjs/components/prism-go";

export class CodeTitle extends TitlePlugin {
  name = "codeTitle";

  override spec() {
    return {
      ...super.spec(),
      tag: "code",
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
        cmd.transform.insertText(selection, data ?? key, false)?.Dispatch();
      },
    };
  }

  override keydown(): Partial<EventHandler> {
    return {
      enter: (ctx: EventContext<any>) => {
        const { app } = ctx;
        const { selection } = ctx.app.state;
        // insert a new line into the title
        if (selection.isCollapsed) {
          preventAndStopCtx(ctx);
          app.cmd.transform.insertText(selection, "\n").Dispatch();
        }
      },
      tab: (ctx: EventContext<any>) => {
        const { app } = ctx;
        const { selection } = ctx.app.state;
        // insert a tab into the title
        if (selection.isCollapsed) {
          preventAndStopCtx(ctx);
          app.cmd.transform.insertText(selection, `  `).Dispatch();
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

  override sanitize(node: Node, pm: PluginManager): Optional<Node> {
    const sanitized = node.clone((data) => ({
      ...data,
      children: CodeTitle.highlightContent(node).map((child) =>
        child.setParentId(node.id),
      ),
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

    const { schema } = node.type;

    const nodes = markLightTokens
      .map((t) => {
        const { start, end, marks } = t;
        const text = textContent.slice(start, end);
        const textNode = schema.text(text, {
          props: {
            [MarksPath]: marks.map((m) => m.toJSON()),
            [CodeTokenClassPath]: "token " + t.token,
          },
        });

        // console.log(textNode);
        return textNode;
      })
      .filter(identity) as Node[];

    return nodes;
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
          if (tok === "\n") {
            console.log("newline", `"${tok.trim()}"`);
            return {
              tokens: [
                ...tokens,
                {
                  content: tok,
                  type: "newline",
                  start: offset,
                  end: offset + tok.length,
                },
              ],
              offset: offset + tok.length,
            };
          }

          if (tok.replace(/^\s+|\s+$/g, "") === "") {
            console.log("whitespace", `"${tok}"`);
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
