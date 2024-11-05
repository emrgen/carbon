import {
  Fragment,
  Mark,
  MarksPath,
  MatchResult,
  Node,
  Schema,
} from "@emrgen/carbon-core";
import { ContentMatch } from "@emrgen/carbon-core/src/core/ContentMatch";
import {
  first,
  flatten,
  identity,
  isArray,
  isEmpty,
  isFunction,
  last,
  takeWhile,
} from "lodash";
import { lexer, Token, TokensList } from "marked";

// parse: markdown(text) -> carbon content json
export const parseText = (text: string) => {
  const tree: TokensList = lexer(text, {});
  // console.log('blob text', `"${text}"`);
  // console.log("syntax tree\n", JSON.stringify(tree, null, 2));

  const nodes = flatten(transformer.transform(tree));
  const withTitleNodes = wrapInlineWithTitle(nodes);

  const validSiblings = removeInlinesWithBlockSibling(withTitleNodes);

  // console.log(JSON.stringify(validSiblings, null, 2));

  return validSiblings;
};

const wrapInlineWithTitle = (nodes: any[]) => {
  // take text nodes and wrap them in title node
  const inlineNodes = takeWhile(nodes, isInlineNode);

  const titleNode = inlineNodes.length ? title(inlineNodes) : null;
  const mappedNodes = nodes.slice(inlineNodes.length).map(mapWrapWithTitle);

  return titleNode ? [titleNode, ...mappedNodes] : mappedNodes;
};

const mapWrapWithTitle = (n) => {
  if (isEmpty(n.children)) return n;
  return {
    ...n,
    children: wrapInlineWithTitle(n.children),
  };
};

// remove inlines nodes with sibling block node
const removeInlinesWithBlockSibling = (nodes) => {
  const stack: any = [];
  const cleaned = nodes.filter((n, i) => {
    if (isInlineNode(n)) {
      if (stack.lengh) {
        if (isBlockNode(last(stack))) {
          return false;
        }
      }

      const next = nodes[i + 1];
      if (next && isBlockNode(next)) {
        return false;
      }
    }

    stack.push(n);
    return true;
  });

  return cleaned.map((n) => {
    if (isEmpty(n.children)) {
      return n;
    }

    return {
      ...n,
      children: removeInlinesWithBlockSibling(n.children),
    };
  });
};

// push marks to inline nodes
const processMarks = () => {};

export const fixContentMatch = (schema: Schema, node: Node) => {
  if (node.isText) return [node];
  const { children, type } = node;

  const fixedChildren = flatten(
    children.map((child) => {
      return fixContentMatch(schema, child);
    }),
  ).filter(identity) as Node[];

  const matched: Node[] = [];
  const match = findMatchingNodes(
    matched,
    type.contentMatch,
    fixedChildren,
    [],
  );

  if (!match.validEnd) {
    return node.children;
  }

  return [
    schema.nodeFromJSON({
      name: node.name,
      children: matched,
      props: node.props,
    })!,
  ];
};

const transformer = {
  // transform the marked syntax tree into a carbon syntax tree
  transform(nodes: TokensList | Token[]) {
    if (!isArray(nodes)) {
      return this.transform([nodes]);
    }

    const result = nodes
      .map((n) => {
        const processor = this[n.type];
        if (!processor) {
          console.error(`Unknown node type: ${n.type}`);
          return null;
        }

        if (!isFunction(processor)) {
          console.error(`${n.type}: is not a function`);
          return null;
        }

        return processor.bind(this)(n);
      })
      .filter(identity);

    return flatten(result);
  },

  space(root: any) {
    return section([title()]);
  },
  code(root: any) {
    return node("code", [node("codeLine", [text(root.text)])], {
      "remote/state/code/lang": root.lang ?? "",
    });
  },

  heading(root: any) {
    const { tokens = [], depth } = root;
    return node(`h${depth}`, this.transform(tokens));
  },
  // block level nodes
  table(root: any) {
    throw Error("Not implemented");
  },

  hr(root: any) {
    return node("divider");
  },

  paragraph(root: any) {
    const { tokens = [] } = root;
    return section(this.transform(tokens));
  },

  link(root: any) {
    const { href, tokens } = root;
    return node("link", this.transform(tokens), {
      "remote/state/link/href": href,
    });
  },
  blockquote(root: any) {
    const { tokens = [] } = root;
    return node("quote", this.transform(tokens));
  },

  list(root: any) {
    const { items = [] } = root;
    // console.log('root', JSON.stringify(root, null, 2));
    return flatten(items.map((i) => this[i.type](i)));
  },
  list_item(root: any) {
    const { raw } = root;
    const listText = raw.trim();
    const tokens = root.tokens?.filter((n) => n.type !== "space") ?? [];
    // console.log('listStart', `"${listStart}"`);

    if (listText.startsWith("- [ ]") || listText.startsWith("- [x]")) {
      return node("checkList", this.transform(tokens));
    }

    if (listText.startsWith("-")) {
      return node("bulletList", this.transform(tokens));
    }

    if (listText.startsWith("* [")) {
      return node("todo", this.transform(tokens));
    }

    if (listText.startsWith("*")) {
      return node("bulletList", this.transform(tokens));
    }

    const listStart = listText.match(/^[0-9a-z]+/)?.[0];
    if (listStart) {
      return node("numberList", this.transform(tokens));
    }

    throw new Error(`Unknown list type: ${listStart}`);
  },

  image(root) {
    return node("image", [], {
      "remote/state/image/src": root.href,
    });
  },

  html(root: { text: string }) {
    return section([text(root.text)]);
  },

  // inline nodes
  text(root: any) {
    const { tokens = [] } = root;
    if (tokens.length > 0) {
      return flatten(tokens.map((t) => this[t.type](t)));
    }

    // check if the text has emoji

    return text(root.raw);
  },
  codespan: (root: any) => {
    return node(
      "codespan",
      [text(root.raw.slice(1, -1))],
      {
        [MarksPath]: [Mark.CODE].map((m) => m.toJSON()),
      },
      {
        type: "inline",
        group: "inline mark",
      },
    );
  },
  em(root: any) {
    return node(
      "italic",
      this.transform(root.tokens),
      {
        [MarksPath]: [Mark.ITALIC].map((m) => m.toJSON()),
      },
      {
        type: "inline",
        group: "inline mark",
      },
    );
  },
  strong(root: any) {
    return node(
      "bold",
      this.transform(root.tokens),
      {
        [MarksPath]: [Mark.BOLD].map((m) => m.toJSON()),
      },
      {
        type: "inline",
        group: "inline mark",
      },
    );
  },
};

const isInlineNode = (node: { name: string }) => {
  return ["text", "bold", "italic", "link", "codespan"].includes(node.name);
};

const isBlockNode = (node) => !isInlineNode(node);

export const node = (
  name: string,
  children: any[] = [],
  props = {},
  metadata = {},
) => {
  return {
    name,
    children,
    props,
    metadata,
  };
};

export const section = (children: any[]) => {
  return node("section", children);
};

export const title = (children: any[] = []) => {
  return node("title", children);
};

export const text = (content: string) => {
  return {
    name: "text",
    text: content,
  };
};

export const findMatchingNodes = (
  before: Node[],
  contentMatch: ContentMatch,
  nodes: Node[],
  after: Node[],
): MatchResult => {
  if (nodes.length === 0) {
    const nextMatch = contentMatch.matchFragment(Fragment.from(after));
    return {
      match: contentMatch,
      validEnd: !!nextMatch?.validEnd,
    };
  }

  const node = first(nodes) as Node;

  const currMatch = contentMatch.matchFragment(Fragment.from([node]));
  if (currMatch) {
    // console.log("matched", node.name);
    before.push(node);
    const result = findMatchingNodes(before, currMatch, nodes.slice(1), after);
    if (result.validEnd) {
      return result;
    } else {
      before.pop();
    }
  }

  return findMatchingNodes(
    before,
    contentMatch,
    node.children.concat(nodes.slice(1)),
    after,
  );
};
