import { lexer, Token, TokensList } from "marked";
import { flatten, isArray, isEmpty, last, takeWhile } from "lodash";

export const parseText = (text: string) => {
  const tree: TokensList = lexer(text);
  // console.log('blob text', `"${text}"`);
  console.log("syntax tree", JSON.stringify(tree, null, 2));

  const nodes = flatten(transformer.transform(tree));
  const withTitleNodes = wrapInlineWithTitle(nodes);

  const validSiblings = removeInlinesWithBlockSibling(withTitleNodes);

  console.log(JSON.stringify(validSiblings, null, 2));

  return validSiblings;
};

const wrapInlineWithTitle = (nodes) => {
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

const processMarks = () => {};

const findContentMatch = () => {};

const transformer = {
  // transform the marked syntax tree into a carbon syntax tree
  transform(nodes: TokensList | Token[]) {
    if (!isArray(nodes)) {
      return this.transform([nodes]);
    }

    const result = nodes.map((n) => {
      if (!this[n.type]) {
        throw new Error(`Unknown node type: ${n.type}`);
      }

      return this[n.type](n);
    });

    return flatten(result);
  },

  space(root: any) {
    return section([title()]);
  },
  code(root: any) {
    return node("code", [text(root.text)], {
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
    const { tokens = [], raw } = root;
    const listText = raw.trim();
    // console.log('listStart', `"${listStart}"`);

    if (listText.startsWith("- [ ]") || listText.startsWith("- [x]")) {
      return node("checkList", this.transform(tokens));
    }

    if (listText.startsWith("-")) {
      return node("bulletList", this.transform(tokens));
    }

    const listStart = listText.match(/^[0-9a-z]+/)?.[0];
    if (listStart) {
      return node("numberedList", this.transform(tokens));
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
  codespan: (root: any) => {
    return node("codespan", [text(root.raw.slice(1, -1))]);
  },
  text(root: any) {
    const { tokens = [] } = root;
    if (tokens.length > 0) {
      return flatten(tokens.map((t) => this[t.type](t)));
    }
    return text(root.raw);
    // return text(root.raw);
  },
  em(root: any) {
    return node("italic", this.transform(root.tokens));
  },
  strong(root: any) {
    return node("bold", this.transform(root.tokens));
  },
};

const isInlineNode = (node: { name: string }) => {
  return ["text", "bold", "italic", "link", "codespan"].includes(node.name);
};

const isBlockNode = (node) => !isInlineNode(node);

export const node = (name: string, children: any[] = [], props = {}) => {
  return {
    name,
    children,
    props,
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
