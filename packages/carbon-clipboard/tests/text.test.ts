import {expect, test} from 'vitest'
import {parseText, section, title, text, node} from "../src/parser/text";

test('parse plain space', () => {
  const content = 'a \n\n b ';
  const res = parseText(content);
  expect(res).toMatchObject([
    section([title([text('a ')])]),
    section([title([])]),
    section([title([text(' b ')])])
  ])
})

test('parse plain header', () => {
  const content = '# hello';
  const res = parseText(content);
  expect(res).toMatchObject([
    node('h1',[title([text('hello')])])
  ])
})

test('parse plain paragraph', () => {
  const content = 'hello';
  const res = parseText(content);
  expect(res).toMatchObject([
    section([title([text('hello')])])
  ])
});

test('parse code block', () => {
  const content = '```js\nconst fn = () => hi\n```';
  const res = parseText(content);
  expect(res).toStrictEqual([
   node('code', [
     title([
       text('const fn = () => hi')
     ])
   ], {
      'remote/state/code/lang': 'js'
   })
  ])
})

// parse br
test('parse paragraph', () => {
  const content = '`const` fn = () => *hi*';
  const res = parseText(content);
  // console.log(JSON.stringify(tree, null, 2));
  // console.log('transformed tree', JSON.stringify(parseText(text), null, 2));
  expect(res).toMatchObject([
    section([title([text('const'), text(' fn = () => '), text('hi')])])
  ])
});
