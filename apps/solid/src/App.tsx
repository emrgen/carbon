import './App.css'
import {noop} from 'lodash';

import {SolidNodeFactory, RendererProps, SolidState, CarbonContext, useCarbon} from '@emrgen/carbon-solid';
import {blockPresetPlugins, node, section, text, title} from '@emrgen/carbon-blocks';
import {
  Schema,
  PluginManager,
  Node,
  Carbon,
  PinnedSelection,
  LocalHtmlAttrPath,
  corePresetPlugins, State
} from '@emrgen/carbon-core';
import {createEffect, createSignal, For, onCleanup} from "solid-js";
import {Optional} from "@emrgen/types";

const plugins = [
  ...corePresetPlugins,
  ...blockPresetPlugins,
]

const pm = new PluginManager(plugins);
const {specs} = pm;
const schema = new Schema(specs, new SolidNodeFactory());

const data = node("carbon", [
  node('document', [
    title([]),
    section([title([text("section 1")])]),
    section([title([text("section 2")])]),
    section([title([text("section 3")])]),
  ])
]);

const content = schema.nodeFromJSON(data)!

// @ts-ignore
window.content = content;

const state = SolidState.create(content, PinnedSelection.NULL);

const app = new Carbon(state, schema, pm);

// @ts-ignore
window.app = app;


// console.log = noop;
// console.info = noop;
// console.debug = noop;
// console.warn = noop;
// console.error = noop;
console.group = noop;
console.groupCollapsed = noop;
console.groupEnd = noop;
console.time = noop;

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

  const onChange = (state: State) => {
    console.log('[changed state]', state)
  }

  app.on('changed', onChange)

  onCleanup(() => {
    app.off('changed', onChange)
  })

  return (
    <CarbonContext value={app}>
      {/*listen and fire events into the app*/}
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

  let ref: Optional<HTMLElement> = null;
  createEffect(() => {
    app.store.register(node, ref)
  })


  if (node.isVoid) {
    return (
      <div data-name={node.name} data-id={node.key} {...node.props.prefix(LocalHtmlAttrPath)} ref={ref}>
        <span>&shy;</span>
      </div>
    );
  }

  return (
    <div data-name={node.name} data-id={node.key} {...node.props.prefix(LocalHtmlAttrPath)} ref={ref}>
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
  const app = useCarbon();

  // const changeTextRandomly = () => {
  //   node.updateContent(node.textContent + ' ' + Math.random().toString(36).substring(7));
  // }

  let ref: Optional<HTMLElement> = null;
  createEffect(() => {
    app.store.register(node, ref)
  })

  return (
    <span data-name={node.name} data-id={node.key} ref={ref}>
      {node.textContent}
    </span>
  );
}


export default App
