import {lexer, TokensList} from "marked";
import {flatten, flattenDeep, isArray, takeWhile} from "lodash";

export const parseText = (text: string) => {
  const tree: TokensList = lexer(text);
  // console.log('blob text', `"${text}"`);
  // console.log('syntax tree', JSON.stringify(tree, null, 2));

  return flatten(transformer.transform(tree));
}

const transformer = {
  // transform the marked syntax tree into a carbon syntax tree
  transform(nodes: TokensList | any) {
    if (!isArray(nodes)) {
      return this.transform([nodes])
    }

    return nodes.map(n => {
      if (!this[n.type]) {
        throw new Error(`Unknown node type: ${n.type}`);
      }

      return this[n.type](n);
    });
  },

  // block level nodes

  list(root: any) {
    const {items = []} = root;
    // console.log('root', JSON.stringify(root, null, 2));
    return flatten(items.map(i => this[i.type](i)));
  },
  list_item(root: any) {
    const {tokens = [], raw} = root;
    let listStart = raw.trim()[0];

    if (listStart === '-') {
      node('bulletList', this.parseNestableChildren(tokens));
    }

    if (listStart.match(/[0-9a-z]+/)) {
      return node('numberedList', this.parseNestableChildren(tokens));
    }

    throw new Error(`Unknown list type: ${listStart}`);
  },

  // parse children of a node
  parseNestableChildren(tokens: any[]) {
    const children: any[] = [];
    const titleTokens = takeWhile(tokens, t => {
      return t.type === 'text' || t.type === 'space';
    })

    if (titleTokens.length > 0) {
      children.push(title(flattenDeep(titleTokens.map(t => this[t.type](t)))));
    }

    const remainingTokens = tokens.slice(titleTokens.length);
    if (remainingTokens.length > 0) {
      children.push(remainingTokens.map(t => this[t.type](t)));
    }


    return flattenDeep(children);
  },


  space(root: any) {return section([title()]) },
  heading(root: any) {
    const {tokens = [], depth} = root;
    const children = this.parseNestableChildren(tokens);
    return node(`h${depth}`,children);
  },
  paragraph(root: any) {
    const {tokens = []} = root;
    const children = tokens.map(t => this[t.type](t));
    const texts = [];
    return section([title(children)]);
  },
  code(root: any) {
    return node('code', [title([text(root.text)])], {
      'remote/state/code/lang': root.lang ?? '',
    });
  },

  // inline nodes
  codespan: (root: any) => {
    return text(root.text);
  },
  text(root: any){
    const {tokens = []} = root;
    if (tokens.length > 0) {
      return flatten(tokens.map(t => this[t.type](t)));
    }
    return text(root.raw);
    // return text(root.raw);
  },
  em: (root: any) => {
    return text(root.text);
  }
}

export const node = (name: string, children: any[], props = {}) => {
  return {
    name,
    children,
    props
  }
}

export const section = (children: any[]) => {
  return node('section', children);
}

export const title = (children: any[] = []) => {
  return node('title', children);
}

export const text = (content: string) => {
  return {
    name: 'text',
    text: content
  }
}
