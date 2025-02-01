import { $, component$, useStore } from "@builder.io/qwik";
import "./app.css";
import { blockPresetPlugins } from "@emrgen/carbon-blocks";
import {
  corePresetPlugins,
  Node,
  NodeData,
  PluginManager,
  Schema,
} from "@emrgen/carbon-core";
import { ImmutableNodeFactory } from "@emrgen/carbon-react";
import { Predicate } from "@emrgen/types";

const plugins = [...corePresetPlugins, ...blockPresetPlugins];

const pm = new PluginManager(plugins);
const schema = new Schema(pm.specs, new ImmutableNodeFactory());

const content: Node = schema
  .type("paragraph")
  .create([
    schema.type("title").create([schema.text("Hello, World! 1")!])!,
    schema
      .type("paragraph")
      .create([
        schema.type("title").create([schema.text("Hello, World! 2")!])!,
      ])!,
  ])!;

// const ChangeContext = createContextId<EventEmitter>('change')

const Block = {
  find(data: NodeData, fn: Predicate<NodeData>): any {
    if (fn(data)) return data;

    for (const child of data.children?.values() || []) {
      const result = Block.find(child, fn);
      if (result) return result;
    }

    return null;
  },
};

export const App = component$(() => {
  // const count = useSignal(content);
  const root = useStore({ name: "paragraph", children: [] });

  // const change = new EventEmitter();
  // useContextProvider(ChangeContext, change);

  const onChange = $(() => {
    console.log(root);
    const text = Block.find(root, (n) => n.name === "text");
    console.log(text);
    text.textContent += "!";
  });

  return (
    <div>
      <button
        onClick$={() => {
          onChange();
        }}
      >
        Click Me
      </button>
      <div class={"carbon-app"}>
        <Section node={content} />
      </div>
    </div>
  );
});

interface RendererProps {
  node: NodeData;
}

const Section = component$((props: RendererProps) => {
  return (
    <div data-id={props.node.id} data-name={props.node.name}>
      {/*{props.node.children?.map((child) => (*/}
      {/*  <Renderer node={child} key={child.id} />*/}
      {/*))}*/}
    </div>
  );
});

const Title = component$((props: RendererProps) => {
  return (
    <div data-id={props.node.id} data-name={props.node.name}>
      {props.node.children?.map((child) => (
        <Renderer node={child} key={child.id} />
      ))}
    </div>
  );
});

const Text = component$((props: RendererProps) => {
  // const data = useStore(props.node.data)
  // const change = useContext(ChangeContext);
  //
  // useTask$(async ({cleanup}) => {
  //   const onChange = (node: Node) => {
  //     console.log('change', node.id.toString());
  //   }
  //
  //   change.on('change', onChange)
  //   cleanup(() => {
  //     change.off('change', onChange)
  //   })
  // });

  return (
    <span data-id={props.node.id} data-name={props.node.name}>
      {props.node.textContent}
    </span>
  );
});

const Renderer = component$((props: RendererProps) => {
  switch (props.node.name) {
    case "paragraph":
      return <Section node={props.node} />;
    case "title":
      return <Title node={props.node} />;
    case "text":
      return <Text node={props.node} />;
    default:
      return null;
  }
});
