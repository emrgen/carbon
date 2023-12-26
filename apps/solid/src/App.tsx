import './App.css'

import {SolidNodeFactory} from '@emrgen/carbon-solid';
import {blockPresetPlugins} from '@emrgen/carbon-blocks';
import {Schema, PluginManager, Node, RendererProps, BlockContent, NodeMap} from '@emrgen/carbon-core';
import {createEffect, createSignal, For} from "solid-js";

const plugins = [
  ...blockPresetPlugins,
]

const pm = new PluginManager(plugins);
const {specs} = pm;
const schema = new Schema(specs, new SolidNodeFactory());
// @ts-ignore
window.schema = schema
console.log(schema)

const section = schema.type('section');

const content = section.create([
  schema.text('Hello')!,
  section.create([
    schema.text('World')!,
  ])!,
])!;

// console.log(content?.textContent);
// console.log(content);

// @ts-ignore
window.content = content;

const map = NodeMap.empty();

content.all(n => {
  map.set(n.id, n);
})

function App() {
  const handleClick = () => {
    const newContent = section.create([
      schema.text('New')!,
    ])!
    content.updateContent(BlockContent.create(
      [
        ...content.children,
        newContent,
      ]
    )!)

    newContent.all(n => {
      map.set(n.id, n);
    })

    setCount(count() + 1)
  };

  const [count, setCount] = createSignal(0)

  return (
    <>
      <button onclick={handleClick}>Click</button>
      <div class={"bg-indigo-500 text-sky-400"}>
        123
        {render(content, map)}
      </div>
    </>
  )
}

// const RenderContext = createContext(null);

const render = (node: Node, map: NodeMap) => {
  // console.log(node)
  if (node.isBlock) {
    return <BlockElement node={node} map={map}/>;
  }

  if (node.isText) {
    return <TextElement node={node} map={map}/>;
  }

  return null;
}

const BlockElement = (props: RendererProps) => {
  const {node, map} = props;
  return (
    <div data-name={node.name} data-id={node.key} >
      <For each={node.children}>
        {(child) => {
          return render(child, map);
        }}
      </For>
    </div>
  );
}

const TextElement = (props: RendererProps) => {
  const {node, map} = props;
  const changeTextRandomly = () => {

    const target = map.get(node.id) as Node;
    if (!target) {
      console.log('target not found', node.id, node.textContent, node, map)
      return;
    }
    console.log(target.key, target.textContent, target)
    target.parent?.updateContent(BlockContent.create([
      section.create([
        schema.text('Changed 1')!
      ])!,
      section.create([
        schema.text('Changed 2')!
      ])!
    ]));
    target.parent?.all(n => {
      map.set(n.id, n);
    })
    // target.parent.updateContent(InlineContent.create('Changed')!);
  }

  return (
    <span data-name={node.name} data-id={node.key} onclick={changeTextRandomly}>
      <span >
        {node.textContent + ' '}
      </span>
      <span>{node.path.join(',')}</span>
    </span>
  );
}


export default App
