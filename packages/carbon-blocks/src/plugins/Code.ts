import {
  BeforePlugin,
  CarbonPlugin,
  EventContext,
  EventHandler,
  NodeSpec,
  preventAndStop,
  preventAndStopCtx
} from "@emrgen/carbon-core";

export class Code extends CarbonPlugin {
  name = 'code';

  spec(): NodeSpec {
    return {
      group: 'content',
      content: 'title',
      splitName: 'section',
      inlineSelectable: true,
      isolate: true,
      draggable: true,
      dragHandle: true,
      rectSelectable: true,
      blockSelectable: true,
      insert: true,
      info: {
        title: 'Code',
        description: 'Insert a code block',
        icon: 'code',
        tags: ['code', 'codeblock', 'pre', 'source'],
      },
      props: {
        local: {
          placeholder: {
            empty: '',
            focused: ''
          },
        },
        html: {
          suppressContentEditableWarning: true,
        }
      }
    }
  }

  plugins(): CarbonPlugin[] {
    return [
      new BeforeCodePlugin(),
    ]
  }

  handlers(): Partial<EventHandler> {
    return {
      paste: (ctx: EventContext<ClipboardEvent>) => {
        const { event, app } = ctx
        preventAndStop(event);
        ctx.stopPropagation();
        const { selection } = app

        // if (!react.state.runtime.clipboard.isEmpty) {
        //   const { slice } = react.state.runtime.clipboard;
        //   const textContent = slice.root.textContent;
        //   console.log('textContent', textContent);
        //   // Slice.create(slice.root, slice.start, slice.end);
        //   react.cmd.transform.paste(selection, blockSelection, slice)?.Dispatch()
        // } else {
        //
        // }
      }
    }
  }

  keydown(): Partial<EventHandler> {
    return {
      enter: (ctx: EventContext<KeyboardEvent>) => {
        preventAndStopCtx(ctx);
        const { app, currentNode } = ctx;
        const { selection } = app;
        // if (selection.isBlock === 1) {
        //   console.log('blockSelection', react.blockSelection);
        //
        //   preventAndStopCtx(ctx);
        //   react.tr.selectNodes([]).Dispatch();
        //   node.child(0)?.emit('focus', node.child(0)!)
        // }
      },

      tab: (ctx: EventContext<KeyboardEvent>) => {
        ctx.event.preventDefault();
        ctx.stopPropagation();
        const { app, cmd } = ctx;
        const { selection } = app;

        cmd.transform.insertText(selection, '  ')?.Dispatch();
      },

      // backspace: (ctx: EventContext<KeyboardEvent>) => {
      //   const { react, event, node } = ctx;
      //   const { selection, cmd } = react;
      //   const { start } = selection;

      //   if (selection.isCollapsed && start.isAtStart) {
      //     ctx.event.preventDefault();
      //     ctx.stopPropagation();
      //     react.tr
      //       .change(node.id, 'code', 'section')
      //       .select(selection)
      //       .Dispatch();
      //   }
      // }
    }
  }
}

export class BeforeCodePlugin extends BeforePlugin {
  name = 'beforeCode';

  // priority = 10002;

  // handlers(): EventHandlerMap {
  //   return {
  //     // insert text node at
  //     beforeInput: (ctx: EventContext<any>) => {
  //       const { react, event, node } = ctx;
  //       const withinCode = node.parents.find(n => n.name === 'code');
  //
  //       if (!withinCode) return
  //       preventAndStopCtx(ctx);
  //       const { data, key } = event.nativeEvent;
  //       const text = data ?? key;
  //       this.insertText(ctx, text);
  //     },
  //   }
  // }
  //
  // keydown(): Partial<EventHandler> {
  //   return {
  //     enter: (ctx: EventContext<KeyboardEvent>) => {
  //       const { react, event, node } = ctx;
  //       if (react.selection.isBlock) {
  //         return
  //       }
  //
  //       const withinCode = node.parents.find(n => n.name === 'code');
  //       if (!withinCode) return
  //
  //       preventAndStopCtx(ctx);
  //       this.insertText(ctx, '\n');
  //     }
  //   }
  // }
  //
  // insertText(ctx: EventContext<any>, text: string) {
  //   const { react, event, node } = ctx;
  //   const { firstChild: textBlock } = node;
  //   if (!textBlock) {
  //     console.error(`textBlock not found for block ${node.id.toString()}`);
  //     return;
  //   }
  //
  //   const { selection, commands } = react;
  //   // console.log('textBlock', textBlock);
  //
  //   const updateTitleText = (carbon: Carbon) => {
  //     console.log('insertText', prism);
  //
  //     const { tr } = carbon;
  //     const { schema, selection } = carbon;
  //     const { head, start } = selection;
  //     const title = head.node;
  //     const pin = Pin.future(start.node, start.offset + text.length);
  //     const after = PinnedSelection.fromPin(pin);
  //     const textContent = title.textContent.slice(0, start.offset) + String.raw`${text}` + title.textContent.slice(start.offset);
  //     const textNode = schema.text(String.raw`${textContent}`)!;
  //     if (!textNode) {
  //       console.error('failed to create text node');
  //       return tr
  //     }
  //
  //     const tokens = prism.tokenize(textContent, prism.languages.javascript);
  //     console.log('tokens', tokens);
  //     const intoTextNode = (token: TokenStream) => {
  //       if (token instanceof Token) {
  //         const { type, content } = token;
  //         if (Array.isArray(content)) {
  //           return flatten(content).map(intoTextNode);
  //         } else if (content instanceof Token) {
  //           return intoTextNode(content);
  //         } else if (typeof content === 'string') {
  //           // return schema.text(content, {
  //           //   attrs: {
  //           //     html: {
  //           //       [`className`]: `token ${type}`,
  //           //     }
  //           //   }
  //           // });
  //         }
  //       } else if (Array.isArray(token)) {
  //         return flatten(token).map(intoTextNode);
  //       } else {
  //         // return schema.text(token, {
  //         //   attrs: {
  //         //     html: {
  //         //       [`className`]: `token`,
  //         //     }
  //         //   }
  //         // });
  //       }
  //     };
  //
  //     const textNodes = flattenDeep(flattenDeep(tokens).map(intoTextNode));
  //
  //     tr.Add(SetContentAction.create(title.id, BlockContent.create(textNodes)));
  //     tr.Select(after);
  //     return tr;
  //
  //   }
  //
  //   if (!selection.isCollapsed) {
  //     commands.transform.delete(selection)?.then(carbon => {
  //       return updateTitleText(carbon);
  //     }).Dispatch();
  //     return
  //   }
  //
  //   if (selection.isCollapsed) {
  //     updateTitleText(react).Dispatch()
  //     return
  //   }
  // }
}
