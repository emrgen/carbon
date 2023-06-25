import { BeforePlugin, Carbon, EventContext, EventHandler, EventHandlerMap, Fragment, no } from "../core";
import { preventAndStop } from "../utils/event";

export class ClipboardPlugin extends BeforePlugin {
  name = "clipboard";

  on(): EventHandlerMap {
    return {
      cut: (ctx: EventContext<any>) => {
        const { event, app } = ctx
        preventAndStop(event);
        const fragment = this.fragment(app);
        if (fragment.isEmpty) {
          return
        }

        const serialized = fragment.nodes.map(n => app.serialize(n)).join('\n')
        console.log('Serialized =>', serialized);
        event.clipboardData.setData('text/plain', serialized);

        // TODO: sanitize the fragment, remove all ids and references to the old document
        // keep external references to images, links, etc
        app.state.runtime.clipboard.setFragment(fragment);

        // delete the selection
        app.cmd.keyboard.backspace(ctx)?.dispatch();
      },
      copy: (ctx: EventContext<any>) => {
        const { event, app } = ctx
        preventAndStop(event);

        console.log('copy', event);
        const fragment = this.fragment(app);
        if (!fragment.isEmpty) {
          const serialized = fragment.nodes.map(n => app.serialize(n)).join('\n')
          console.log('Serialized =>', serialized);
          event.clipboardData.setData('text/plain', serialized);

          app.state.runtime.clipboard.setFragment(fragment);
          return
        }

      },
      paste: (ctx: EventContext<any>) => {
        const { event, app } = ctx
        preventAndStop(event);

        if (!app.state.runtime.clipboard.isEmpty) {
          const { fragment } = app.state.runtime.clipboard;
          const { nodes } = fragment;
          console.log('paste', nodes);
          // check if we can paste into the current selection
          // app.insertNodes(nodes);
          return
        }
        console.log('paste', app.state.runtime.clipboard.fragment.nodes);

        // console.log('paste', event);
      }
    };
  }

  fragment(app: Carbon): Fragment {
    const { selection, nodeSelection } = app;
    if (nodeSelection.size) {
      const { nodes } = nodeSelection;
      return Fragment.from(nodes.map(n => {
        const node = n.clone()
        node.parent = null;
        return node;
      }));
    }

    const {} = selection;
    return Fragment.from([])
  }
}
