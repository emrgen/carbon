import {useEffect} from "react";

import {blockPresetPlugins, node, text, title, section} from "@emrgen/carbon-blocks";
import {ReactRenderer, RendererProps, RenderManager, useCreateCarbon, ImmutableNodeFactory} from "@emrgen/carbon-react";
import {blockPresetRenderers} from "@emrgen/carbon-react-blocks";
import {
  CollapsedPath,
  corePresetPlugins,
  Extension,
  Node,
  NodeId,
  PluginManager,
  Schema,
  State,
  TagPath,
} from "@emrgen/carbon-core";
import {CarbonApp} from "@emrgen/carbon-utils";
import {
  h,
  createElement,
  ChainRenderContext,
  createContext,
  RenderContext,
  NodeChangeContext, ChainNodeChangeManager, getContext
} from "@emrgen/carbon-chain";
import {noop, range} from "lodash";
import SelectionTracker from "../../SelectionTracker";

const data = node("carbon", [
  node("document", [
    title([text("I am a frame title")]),
    //
    // node("tabs", [
    //   node("tab", [
    //     // node("title", [text("tab 1")]),
    //     section([title([text("tab 1 content")])]),
    //   ], {
    //     [ActivatedPath]: true,
    //     [TitlePath]: "tab 11 some big title"
    //   }),
    //   node("tab", [
    //     // node("title", [text("tab 2")]),
    //     section([title([text("tab 2 content")])]),
    //   ], {
    //
    //     [TitlePath]: "tab 12 medium"
    //   }),
    //   node("tab", [
    //     // node("title", [text("tab 3")]),
    //     section([title([text("tab 3 content")])]),
    //   ], {
    //     [TitlePath]: "tab 13"
    //   }),
    // ]),
    //
    // node("commentEditor", [
    //   section([title([text('add a comment')])])
    // ]),
    //
    // // node("blockContent"),
    //
    // section([title([text("section 1")])]),
    //
    // node("code", [
    //   node("codeLine",[ title([text("function foo() {")])]),
    //   node("codeLine", [title([text("  console.log('hello world')")])]),
    //   node("codeLine",[ title([text("}")])])
    // ]),
    //
    // section([title([text("section 1")])]),
    //
    // node("code", [
    //   node("codeLine",[ title([text("function foo() {")])]),
    //   node("codeLine", [title([text("  console.log('hello world')")])]),
    //   node("codeLine",[ title([text("}")])])
    // ]),


    // node("pageTree", [
    //   title([text("Favorites")]),
    //   node(
    //     "pageTreeItem",
    //     [
    //       title([text("Computer Science")]),
    //       node("pageTreeItem", [title([text("Algorithms")])]),
    //       node("pageTreeItem", [title([text("Data Structures")])]),
    //       node("pageTreeItem", [title([text("Operating Systems")])]),
    //     ],
    //     {[CollapsedPath]: true}
    //   ),
    //   node("pageTreeItem",
    //     [
    //       title([text("Electrical Engineering")]),
    //       node("pageTreeItem", [title([text("Circuits")])]),
    //       node("pageTreeItem", [title([text("Digital Logic")])]),
    //       node("pageTreeItem", [title([text("Microprocessors")])]),
    //     ]),
    // ]),

    // node("pageTree", [
    //   title([text("Private")]),
    //   node(
    //     "pageTreeItem",
    //     [
    //       title([text("Physics")]),
    //       node("pageTreeItem", [title([text("Thermodynamics")])]),
    //       node("pageTreeItem", [title([text("Electromagnetism")])]),
    //     ],
    //     {}
    //     // { node: { collapsed: false }, state: { selected: true } }
    //   ),
    //   node("pageTreeItem", [title([text("Mathematics")])]),
    //   node("pageTreeItem", [title([text("Chemistry")])]),
    //   node("pageTreeItem", [title([text("Economics")])]),
    // ]),
    //
    node("section", [title([text("Phycology")])]),

    node(
      "section",
      [
        title([text("section 1")]),
        node(
          "todo",
          [title([text("section 1")]), section([title([text("section")])])],
          {}
        ),
      ],
      {}
    ),

    // node("hstack", [
    //   node("stack", [section([title([text("section 1")])])]),
    //   node("stack", [section([title([text("section 2")])])]),
    //   node("stack", [section([title([text("section 3")])])]),
    // ]),

  ]),
]);

// @ts-ignore
data.id = NodeId.ROOT.toString();

const ImageComp = (props: RendererProps) => {
  return (
    <div contentEditable="false" suppressContentEditableWarning>
      Image
    </div>
  );
};

const extensions1: Extension = {
  renderers: [ReactRenderer.create("image", ImageComp)],
};

const plugins = [
  ...corePresetPlugins,
  ...blockPresetPlugins,
  // carbonUtilPlugins,
  // commentEditorExtension,
  // codeExtension,
  // {
  //   plugins: [
  //     new BlockTree(),
  //   ]
  // }
  // extensions1,
];

const renderers = [
  ...blockPresetRenderers,
];

const renderManager = RenderManager.from(
  renderers,
)

console.log = noop;
console.info = noop;
console.debug = noop;
console.warn = noop;
console.error = noop;
console.group = noop;
console.groupCollapsed = noop;
console.groupEnd = noop;
console.time = noop;


// @ts-ignore
window.h = h
// @ts-ignore
window.createElement = createElement

export default function Dev() {
  const app = useCreateCarbon('dev', data, plugins);

  // @ts-ignore
  window.app = app;

  useEffect(() => {
    const onChange = (state: State) => {
      console.debug(state.changes.patch, Array.from(state.changes.dataMap.values()))
      state.content.all((node) => {
        // console.log(node.id.toString(), node.name, node.properties.toKV());
      });
    }

    app.on("changed", onChange);
    return () => {
      app.off("changed", onChange);
    }
  }, [app]);

  // return (
  //   <></>
  // )

  return (
    <div className={'carbon-app-container'}>
      <CarbonApp app={app} renderManager={renderManager}>
        <SelectionTracker/>
      </CarbonApp>
    </div>
  );
}


// create a render context
const ctx = new ChainRenderContext();

const props = (node: Node) => {
  return {
    'data-id': node.key,
    'data-name': node.name,
    node
  }
}

// create a renderer
const textRenderer = (node: Node) => {
  return h("span", props(node), [node.textContent]);
}

// this should be memoized to avoid creating a new function on every render
// for the first render it's ok to create a new function
// on dismount of the node we should remove the children cache from the context
const renderChildren = (node: Node) => {
  return node.children.map(n => {
    const component = h(ctx.component(n.name)!, n);
    if (!component) {
      throw new Error(`no component for ${n.name}`);
    }

    return component;
  })

}

const titleRenderer = (node: Node) => {
  return h("div", props(node), renderChildren(node));
}

const sectionRenderer = (node: Node) => {
  const ctx = getContext(RenderContext);
  const onClick = (e) => {
    e.stopPropagation();
    // change.notify(node.id, {
    //   type: 'remove',
    //   node: node,
    //   // parent: node.parent as Node,
    // })

    change.notify(node.id, {
      type: 'add:child',
      node: para('xxx')!,
      parent: node,
      offset: 1
    })

    node.updateProps({
      [CollapsedPath]: !node.props.get<boolean>(CollapsedPath)
    })

    change.notify(node.id, {
      type: 'update',
      node: node,
    })
  }

  let interval = null;
  let count = 0;

  const onMouseOver = (e) => {
    e.stopPropagation();
    // console.log('over')
    // interval = setInterval(() => {
    //   change.notify(node.id, {
    //     type: 'add:child',
    //     node: para(count.toString())!,
    //     parent: node,
    //     offset: parent.size
    //   })
    //   count++;
    // }, 16)
  }

  const onMouseOut = (e) => {
    // e.stopPropagation();
    // console.log('out')
    // clearInterval(interval)
  }

  // children updates will update the dom internally
  // so we don't need to do anything here
  // but we need to return a function that will be called
  // when the node is updated, this way we can control the node template structure and attributes
  const checkbox = h('input', {
    type:'checkbox',
    // disabled: true,
    onClick: (e, n: Node) => {
      e.stopPropagation();
      // e.preventDefault();
      const isChecked = n.props.get<boolean>(CollapsedPath)
      console.log('checked', n.props.get<boolean>(CollapsedPath), e.target.checked)
      n.updateProps({
        [CollapsedPath]: !isChecked,
      })
      change.notify(n.id, {
        type: 'update',
        node: n,
      })
    },
    checked: (n: Node) => {
      const isChecked = n.props.get(CollapsedPath) ? 'checked' : ''
      return isChecked
    },
    class: (n: Node) => {
      const attrs: string[] = []
      if (n.props.get(CollapsedPath)) {
        attrs.push('collapsed')
      }
      return attrs.join(' ')
    }
  })

  return h("div", {
    ...props(node),
    // onClick,
    onMouseOver,
    onMouseOut,
  }, [
    checkbox,
    ...renderChildren(node)
  ]);
}

// register the renderer
ctx.component("section", sectionRenderer);
ctx.component("title", titleRenderer);
ctx.component("text", textRenderer);

const change = new ChainNodeChangeManager()

RenderContext.Provider({value: ctx});
NodeChangeContext.Provider({value: change});

//@ts-ignore
window.ctx = ctx;

//@ts-ignore
window.change = change;


const pm = new PluginManager(plugins);
const schema = new Schema(pm.specs, new ImmutableNodeFactory());

const para = (content: string = 'x') => {
  return schema.nodeFromJSON(node("section", [title([text(content)])]));
}

//@ts-ignore
window.section = section;

//@ts-ignore
window.insert = (parent: Node, node: Node) => {
  change.notify(parent.id, {
    type: 'add:child',
    node: node,
    parent,
    offset: 1
  })
}


const s = para('hello world')!;
const root = document.querySelector('#chain')!;

// ctx.mount(root, s);

let counter = 0;
const addBunch = (count = 10) => {
  range(count).forEach(i => {
    const p = para('-' + counter)!;
    ++counter
    change.notify(s.id, {
      type: 'add:child',
      node: p,
      parent: s,
      offset: 1//counter
    })
  })
}

let interval = setInterval(() => {
  addBunch(1)
  // counter++;
  if (counter > 5) {
    clearInterval(interval)
    return
  }
}, 30)














