import {lexer, TokensList} from "marked";
import {isArray} from "lodash";

export const parseText = (text: string) => {
  const tree: TokensList = lexer(text);
  console.log('blob text', `"${text}"`);
  // console.log('syntax tree', tree);


  return transformer.transform(tree);
}

const transformer = {
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
  space(root: any) {return section([title()]) },
  paragraph(root: any) {
    const {tokens = []} = root;
    const children = tokens.map(t => this[t.type](t));
    const texts = [];
    return section([title(children)]);
  },

  codespan: (root: any) => {
    return text(root.text);
  },
  text: (root: any) => {
    return text(root.raw);
  },
  em: (root: any) => {
    return text(root.text);
  }
}


const node = (name: string, children: any[]) => {
  return {
    name,
    children
  }
}

const section = (children: any[]) => {
  return node('section', children);
}

const title = (children: any[] = []) => {
  return node('title', children);
}

const text = (content: string) => {
  return {
    name: 'text',
    text: content
  }
}
