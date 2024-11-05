export const Dummy = () => {
  return null
}

// import {range} from "lodash";
// import {useEffect} from "react";
//
// import {blockPresetPlugins, node, text, title, paragraph} from "@emrgen/carbon-blocks";
// import {ReactRenderer, RendererProps, RenderManager, useCreateCarbon, ImmutableNodeFactory} from "@emrgen/carbon-react";
// import {blockPresetRenderers} from "@emrgen/carbon-react-blocks";
// import {
//   CollapsedPath,
//   corePresetPlugins,
//   Extension,
//   Node,
//   NodeId,
//   PluginManager,
//   Schema,
//   State,
//   TagPath,
// } from "@emrgen/carbon-core";
// import {CarbonApp} from "@emrgen/carbon-utils";
// import {
//   h,
//   createElement,
//   ChainRenderContext,
//   createContext,
//   RenderContext,
//   NodeChangeContext, ChainNodeChangeManager, getContext
// } from "@emrgen/carbon-chain";
// import './chain.styl'
//
// const plugins = [
//   ...corePresetPlugins,
//   ...blockPresetPlugins,
//   // carbonUtilPlugins,
//   // commentEditorExtension,
//   // codeExtension,
//   // {
//   //   plugins: [
//   //     new BlockTree(),
//   //   ]
//   // }
//   // extensions1,
// ];
// const pm = new PluginManager(plugins);
// const schema = new Schema(pm.specs, new ImmutableNodeFactory());
//
// const Empty = () => {
//   return <></>
// }
//
// export const Chain = () => {
//
//   return <Empty/>
//
//   return (
//     <div>
//       <h1>Chain</h1>
//     </div>
//   );
// }
//
//
// // create a render context
// const ctx = new ChainRenderContext();
//
// const computeProps = (node: Node) => {
//   return {
//     'data-id': node.key,
//     'data-name': node.name,
//     node
//   }
// }
//
// // create a renderer
// const textRenderer = (props: RenderProps) => {
//   const {node} = props;
//   return h("span", computeProps(node), [node.textContent]);
// }
//
// // this should be memoized to avoid creating a new function on every render
// // for the first render it's ok to create a new function
// // on dismount of the node we should remove the children cache from the context
// const renderChildren = (node: Node) => {
//   return node.children.map(n => {
//     const component = ctx.component(n.name)?.({node: n});
//     if (!component) {
//       throw new Error(`no component for ${n.name}`);
//     }
//
//     return component;
//   })
//
// }
//
// interface RenderProps {
//   node: Node
// }
//
// const titleRenderer = (props: RenderProps) => {
//   const {node} = props;
//   return h("div", computeProps(node), renderChildren(node));
// }
//
// const sectionRenderer = (props: RenderProps) => {
//   const {node} = props;
//   const ctx = getContext(RenderContext);
//   const onClick = (e) => {
//     console.log(e)
//     e.stopPropagation();
//     // change.notify(node.id, {
//     //   type: 'remove',
//     //   node: node,
//     //   // parent: node.parent as Node,
//     // })
//
//     // change.notify(node.id, {
//     //   type: 'add:child',
//     //   node: para('xxx')!,
//     //   parent: node,
//     //   offset: 1
//     // })
//
//     node.updateProps({
//       [CollapsedPath]: !node.props.get<boolean>(CollapsedPath)
//     })
//
//     change.notify(node.id, {
//       type: 'update',
//       node: node,
//     })
//   }
//
//   let interval = null;
//   let count = 0;
//
//   const onMouseOver = (e) => {
//     e.stopPropagation();
//     // console.log('over')
//     // interval = setInterval(() => {
//     //   change.notify(node.id, {
//     //     type: 'add:child',
//     //     node: para(count.toString())!,
//     //     parent: node,
//     //     offset: parent.size
//     //   })
//     //   count++;
//     // }, 16)
//   }
//
//   const onMouseOut = (e) => {
//     // e.stopPropagation();
//     // console.log('out')
//     // clearInterval(interval)
//   }
//
//   // children updates will update the dom internally
//   // so we don't need to do anything here
//   // but we need to return a function that will be called
//   // when the node is updated, this way we can control the node template structure and attributes
//   const checkbox = h('input', {
//     type:'checkbox',
//     class: (n: Node) => {
//       const attrs: string[] = []
//       if (n.props.get(CollapsedPath)) {
//         attrs.push('collapsed')
//       }
//       return attrs.join(' ')
//     }
//   });
//
//   const add = h('button', {
//     onClick: (e, n: Node) => {
//       e.stopPropagation();
//       const node = para('xxx')!
//       const offset = node.size;
//
//       console.log('inserting at', n.size, n)
//
//       n.insert(node, offset);
//
//       change.notify(n.id, {
//         type: 'add:child',
//         node: node,
//         parent: n,
//         offset: offset,
//       })
//     }
//   }, ['Add']);
//
//   // const remove = h('button', {
//   //   onClick: (e, n: Node) => {
//   //     e.stopPropagation();
//   //
//   //     console.log('removing at', n.index)
//   //     n.parent?.remove(node);
//   //
//   //     change.notify(n.id, {
//   //       type: 'remove',
//   //       node: n,
//   //     })
//   //   }
//   // }, ['Remove'])
//
//   return h("div", {
//     ...computeProps(node),
//     onClick,
//     onMouseOver,
//     onMouseOut,
//   }, [
//     // checkbox!,
//     ...renderChildren(node),
//     add!,
//     // remove!,
//   ]);
// }
//
// // register the renderer
// ctx.component("paragraph", sectionRenderer);
// ctx.component("title", titleRenderer);
// ctx.component("text", textRenderer);
//
// const change = new ChainNodeChangeManager()
//
// RenderContext.Provider({value: ctx});
// NodeChangeContext.Provider({value: change});
//
// //@ts-ignore
// window.ctx = ctx;
//
// //@ts-ignore
// window.change = change;
//
//
// const para = (content: string = 'x') => {
//   return schema.nodeFromJSON(node("paragraph", [title([text(content)])]));
// }
//
// //@ts-ignore
// window.paragraph = section;
//
// //@ts-ignore
// window.insert = (parent: Node, node: Node) => {
//   change.notify(parent.id, {
//     type: 'add:child',
//     node: node,
//     parent,
//     offset: 1
//   })
// }
//
//
// const s = para('hello world')!;
// const root = document.querySelector('#chain')!;
//
// // ctx.mount(root, s);
//
// let counter = 0;
// const addBunch = (count = 10) => {
//   range(count).forEach(i => {
//     const p = para('-' + counter)!;
//     ++counter
//     change.notify(s.id, {
//       type: 'add:child',
//       node: p,
//       parent: s,
//       offset: 1//counter
//     })
//   })
// }
//
// let interval = setInterval(() => {
//   addBunch(1)
//   // counter++;
//   if (counter > 5) {
//     clearInterval(interval)
//     return
//   }
// }, 30)
//
//
//
//
//
//
//
//
//
//
//
//
//
//
