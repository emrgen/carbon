import {expect, test} from 'vitest'
import {lexer} from "marked";
import {parseText} from "../src/parser/text";

function sum(a: number, b: number) {
  return a + b;
}

// parse space
test('update node content', () => {
  const text = 'import {lexer} from "marked"; \n \n hello';
  const tree = lexer(text);
  // console.log(JSON.stringify(tree, null, 2));
})

// parse br
test('update node content', () => {
  const text = '`const` fn = () => *hi*';
  const tree = lexer(text);
  const res = parseText(text);
  // console.log(JSON.stringify(tree, null, 2));
  // console.log('transformed tree', JSON.stringify(parseText(text), null, 2));

  expect(res).toMatchObject([
    {
      name: 'section',
      children: [
        {
          name: 'title',
          children: [
            {
              name: 'text',
              text: 'const'
            },
            {
              name: 'text',
              text: ' fn = () => '
            },
            {
              name: 'text',
              text: 'hi'
            },
          ]
        }
      ]
    }
  ])
});
