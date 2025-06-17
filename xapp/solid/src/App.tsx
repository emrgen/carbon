import "./App.css";
import {blockPresetPlugins, carbon, node, paragraph, text, title,} from "@emrgen/carbon-blocks";
import {
  BlockSelection,
  CarbonEditor,
  CheckedPath,
  corePresetPlugins,
  LocalHtmlAttrPath,
  Node,
  Pin,
  PinnedSelection,
  PluginManager,
  Point,
  preventAndStop,
  Schema,
  SelectedPath,
  State,
} from "@emrgen/carbon-core";

import {
  CarbonContext,
  RendererProps,
  SolidNodeFactory,
  SolidState,
  useCarbon,
} from "@emrgen/carbon-solid";
import {createContext, createEffect, createSignal, For, onCleanup, onMount,} from "solid-js";
import {createMutable} from "solid-js/store";

const plugins = [...corePresetPlugins, ...blockPresetPlugins];

const pm = new PluginManager(plugins);
const { specs } = pm;
const schema = new Schema(specs, new SolidNodeFactory());

const data = carbon([
  node("page", [
    title([]),
    paragraph([title([text("paragraph 1")])]),
    paragraph([title([text("section 2")])]),
    paragraph([title([text("section 3")])]),
  ]),
]);

const content = schema.nodeFromJSON(data)!;

// @ts-ignore
window.content = content;

const state: State = SolidState.create(
  content,
  PinnedSelection.NULL,
  BlockSelection.empty(),
);

const app = new CarbonEditor(state, schema, pm);

// @ts-ignore
window.app = app;

// console.log = noop;
// console.info = noop;
// console.debug = noop;
// console.warn = noop;
// console.error = noop;
// console.group = noop;
// console.groupCollapsed = noop;
// console.groupEnd = noop;
// console.time = noop;

const DndContext = createContext<any>(null);

function App() {
  const addNode = () => {
    setCount(count() + 1);
    const titleNode = schema.nodeFromJSON(
      title([text(`lorem ipsum ${count()}`)]),
    )!;
    const section = schema.nodeFromJSON(node("paragraph", [titleNode]))!;
    // app.content.insert(section, 0);
    app.cmd
      .Insert(Point.toAfter(app.content.child(0)?.firstChild!), section)
      .Select(PinnedSelection.fromPin(Pin.toStartOf(section)!)!)
      .Dispatch();
    // setCount(count() + 1);
  };

  const [count, setCount] = createSignal(0);
  const dnd = {
    dragging: false,
    dragNode: null,
    dragIndex: 0,
    dropIndex: 0,
    listeners: [],
    viewport: document.querySelector("body")!,
    options: null as any,
    observer: null as any,
  };

  let interval: any = null;

  const keepAdding = () => {
    clearInterval(interval);
    interval = setInterval(() => {
      addNode();
    }, 10);
  };

  const stopAdding = () => {
    clearInterval(interval);
  };

  const handleClick = () => {
    clearInterval(interval);
  };

  const onChange = (_: State) => {
    console.debug("[changed state]", count());
    setCount(count() + 1);
  };

  app.on("changed", onChange);

  onCleanup(() => {
    app.off("changed", onChange);
  });

  onMount(() => {
    const node = app.content.find(
      (n) => !!n.props.get("local/html/contentEditable"),
    );
    if (!node) return;
    const el = app.store.element(node.id);
    el?.focus();

    // dnd.viewport = page.querySelector('body')!;
    // dnd.options = {
    //   root: dnd.viewport!,
    //   threshold: 0,
    //   rootMargin: '0px',
    // }
    // dnd.observer = new IntersectionObserver((entries) => {
    //   entries.forEach(entry => {
    //     if (entry.isIntersecting) {
    //       console.log('intersecting', entry.target)
    //     }
    //   })
    // }, dnd.options);
  });

  const object = createMutable({
    name: "subhasis",
    age: 30,
    phone: "1234567890",
  });

  const person = {
    props: object,
    name(prop: string) {
      switch (prop) {
        case "name":
          return this.props.name;
        case "x":
          return this.props.age;
        case "y":
          return this.props.phone;
        default:
          return "unknown";
      }
    },
  };

  // const [propCounter, setPropCounter] = createSignal(1);

  // const name = () => object.name;

  return (
    <DndContext.Provider value={dnd}>
      <CarbonContext value={app}>
        <button
          onclick={handleClick}
          onmousedown={keepAdding}
          onmouseup={stopAdding}
        >
          Click
        </button>
        <button
          onclick={() => {
            object.name = "subhasis" + Math.random();
          }}
        >
          Click
        </button>
        {person.name("name")}
        <div class={"bg-indigo-500 text-sky-400"}>
          {RenderElement(app.content)}
        </div>
      </CarbonContext>
    </DndContext.Provider>
  );
}

// const RenderContext = createContext(null);

const useRegister = (node: Node) => {
  const app = useCarbon();
  // const dnd = useContext(DndContext);

  return (el: HTMLElement) => {
    console.log("registering", node.id.toString(), el);
    app.store.register(node, el);
    // if (dnd.observer) {
    //   dnd.observer.observe(el);
    // }
  };
};

const BlockElement = (props: RendererProps) => {
  const { node } = props;
  const register = useRegister(node);

  const selectedAttr = () => {
    if (node.props.get(SelectedPath)) {
      return {
        "data-selected": true,
      };
    } else {
      return {};
    }
  };

  return (
    <div
      data-name={node.name}
      data-id={node.key}
      {...nodeAttrs(node)}
      ref={register}
      {...selectedAttr}
    >
      {node.isVoid && <span>&shy;</span>}
      {!node.isVoid && (
        <For each={node.children}>
          {(child) => {
            return RenderElement(child);
          }}
        </For>
      )}
    </div>
  );
};

const TextElement = (props: RendererProps) => {
  const { node } = props;
  const register = useRegister(node);

  return (
    <span data-name={node.name} data-id={node.key} ref={register}>
      {node.textContent}
    </span>
  );
};

const nodeAttrs = (node: Node) => {
  const props = node.props.get<Record<string, any>>(LocalHtmlAttrPath) ?? {};
  const attrs: any = {};
  for (const [k, v] of Object.entries(props)) {
    if (
      !(v === null || v === undefined || v == "" || v == "false" || v == false)
    ) {
      attrs[k] = v;
    }
  }

  return attrs;
};

const TodoElement = (props: RendererProps) => {
  const { node } = props;
  const app = useCarbon();
  const register = useRegister(node);

  const toggle = (e: MouseEvent) => {
    e.stopPropagation();
    app.cmd.switch.toggle(node);
  };

  const isChecked = () => {
    return !!node.props.get(CheckedPath);
  };

  createEffect(() => {
    console.log("todo changed", isChecked());
  });

  console.log("xxx", isChecked(), node.props);

  return (
    <div
      data-name={node.name}
      data-id={node.key}
      ref={register}
      {...nodeAttrs(node)}
    >
      <input
        type="checkbox"
        checked={!!node.props.get(CheckedPath)}
        onclick={toggle}
        onmousedown={preventAndStop}
      />
      <For each={node.children}>
        {(child) => {
          return RenderElement(child);
        }}
      </For>
    </div>
  );
};

const NumberedElement = (props: RendererProps) => {
  const { node } = props;
  const register = useRegister(node);
  const listNumber = () => {
    const parent = node.parent;
    if (!parent) return 0;
    const index = parent.children.indexOf(node);
    return index + 1;
  };

  return (
    <div data-name={node.name} data-id={node.key} ref={register}>
      {listNumber()}.&nbsp;
      <For each={node.children}>
        {(child) => {
          return RenderElement(child);
        }}
      </For>
    </div>
  );
};

const components: Record<string, any> = {
  carbon: BlockElement,
  document: BlockElement,
  todo: TodoElement,
  numberList: NumberedElement,
  section: BlockElement,
  title: BlockElement,
  text: TextElement,
};

//
const RenderElement = (node: Node) => {
  const name = () => node.name;
  const Component = () => {
    return components[name()] ?? BlockElement;
  };

  return <>{Component()({ node })}</>;
};

export default App;
