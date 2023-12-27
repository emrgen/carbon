import './App.css'

import {SolidNodeFactory, RendererProps, SolidState, CarbonContext, useCarbon} from '@emrgen/carbon-solid';
import {blockPresetPlugins,node, section, text, title} from '@emrgen/carbon-blocks';
import {Schema, PluginManager, Node, Carbon, PinnedSelection} from '@emrgen/carbon-core';
import {createSignal, For} from "solid-js";

const plugins = [
  ...blockPresetPlugins,
]

const pm = new PluginManager(plugins);
const {specs} = pm;
const schema = new Schema(specs, new SolidNodeFactory());

const data = node("carbon", [
  section([title([text("section 1")])]),
  section([title([text("section 2")])]),
  section([title([text("section 3")])]),
]);

const content = schema.nodeFromJSON(data)!

// @ts-ignore
window.content = content;

const state = new SolidState(content, PinnedSelection.NULL);

const app = new Carbon(state, schema, pm);

// @ts-ignore
window.app = app;


function App() {
  const addNode = () => {
    setCount(count() + 1);
    const titleNode = schema.nodeFromJSON(title([text(`lorem ipsum ${count()}`)]))!;
    const section = schema.nodeFromJSON(node('section', [titleNode]))!;
    app.content.insert(section, 0);
    setCount(count() + 1);
  };

  const [count, setCount] = createSignal(0)

  let interval: any = null;

  const keepAdding = () => {
    clearInterval(interval)
    interval = setInterval(() => {
      addNode();
    }, 10);
  }

  const stopAdding = () => {
    clearInterval(interval);
  }

  const handleClick = () => {
    clearInterval(interval);
  }

  return (
    <CarbonContext value={app}>
      <button onclick={handleClick} onmousedown={keepAdding} onmouseup={stopAdding}>Click</button>
      <div class={"bg-indigo-500 text-sky-400"}>
        {render(app.content)}
      </div>
    </CarbonContext>
  )
}

// const RenderContext = createContext(null);

const render = (node: Node) => {
  // console.log(node)
  if (node.isBlock) {
    return <BlockElement node={node}/>;
  }

  if (node.isText) {
    return <TextElement node={node}/>;
  }

  return null;
}

const BlockElement = (props: RendererProps) => {
  const {node} = props;
  return (
    <div data-name={node.name} data-id={node.key} >
      <For each={node.children}>
        {(child) => {
          return render(child);
        }}
      </For>
    </div>
  );
}

const TextElement = (props: RendererProps) => {
  const {node} = props;
  // const app = useCarbon();
  const changeTextRandomly = () => {
    node.updateContent(node.textContent + ' ' + Math.random().toString(36).substring(7));
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
