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
  corePresetPlugins,
  State, preventAndStop, stop, CheckedPath,
} from '@emrgen/carbon-core';
import {createSignal, For, onCleanup, onMount, Show} from "solid-js";

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
console.info = noop;
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

  const onChange = (_: State) => {
    console.debug('[changed state]', count())

    setCount(count() + 1)
  }

  app.on('changed', onChange)

  onCleanup(() => {
    app.off('changed', onChange)
  })

  onMount(() => {
    const node = app.content.find(n => !!n.props.get('local/html/contentEditable'));
    if (!node) return;
    const el = app.store.element(node.id)
    el?.focus();
  })

  return (
    <CarbonContext value={app}>
      <button onclick={handleClick} onmousedown={keepAdding} onmouseup={stopAdding}>Click</button>
      <div class={"bg-indigo-500 text-sky-400"}>
        {RenderElement(app.content)}
      </div>
    </CarbonContext>
  )
}

// const RenderContext = createContext(null);


const BlockElement = (props: RendererProps) => {
  const {node} = props;

  const register = (el: HTMLElement) => {
    console.log('registering', node.id.toString(), node.parent, el)
    app.store.register(node, el)
  }

  return (
    <div data-name={node.name} data-id={node.key} {...node.props.prefix(LocalHtmlAttrPath)} ref={register}>
      {node.isVoid && <span>&shy;</span>}
      {!node.isVoid && <For each={node.children}>
          {(child) => {
            return RenderElement(child)
          }}
        </For>
      }
    </div>
  );
}

const TextElement = (props: RendererProps) => {
  const {node} = props;
  const app = useCarbon();

  // const changeTextRandomly = () => {
  //   node.updateContent(node.textContent + ' ' + Math.random().toString(36).substring(7));
  // }

  const register = (el: HTMLElement) => {
    console.log('registering', node.id.toString(), node.parent, el)
    app.store.register(node, el)
  }

  return (
    <span data-name={node.name} data-id={node.key} ref={register}>
      {node.textContent}
    </span>
  );
}

const TodoElement = (props: RendererProps) => {
  const {node} = props;
  const app = useCarbon();

  const toggle = (e) => {
    e.stopPropagation();
    app.cmd.switch.toggle(node);
  }

  const register = (el: HTMLElement) => {
    app.store.register(node, el)
  }

  return (
    <div data-name={node.name} data-id={node.key} ref={register}>
      <input type="checkbox" checked={node.props.get(CheckedPath)} onclick={toggle} />
      <For each={node.children}>
        {(child) => {
          return RenderElement(child);
        }}
      </For>
    </div>
  );
}

const components: Record<string, any> = {
  'carbon': BlockElement,
  'document': BlockElement,
  'todo': TodoElement,
  'section': BlockElement,
  'title': BlockElement,
  'text': TextElement,
}

//
const RenderElement = (node: Node) => {
  const name = () => node.name;
  const Component = () => {
    return components[name()] ?? BlockElement
  }

  return (<>{Component()({node})}</>)
}

export default App
