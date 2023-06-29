import { BeforePlugin, BlockContent, Carbon, EventContext, EventHandler, EventHandlerMap, Fragment, InlineContent, Node, Pin, PinnedSelection, Point, no } from "../core";
import { preventAndStop } from "../utils/event";
import { blocksBelowCommonNode, nodesBetweenPoints } from "../utils/findNodes";
import { takeUpto } from '../utils/array';
import { SelectionPatch } from "../core/DeleteGroup";
import { Range } from "../core/Range";
import { NodeId } from "../core/NodeId";
import { last, reverse } from 'lodash';
import { Optional } from '@emrgen/types';

export class ClipboardPlugin extends BeforePlugin {
  name = "clipboard";

  on(): EventHandlerMap {
    return {
      cut: (ctx: EventContext<any>) => {
        const { event, app } = ctx
        preventAndStop(event);
        const fragment = this.fragment(app);
        // if (fragment.isEmpty) {
        //   return
        // }

        // const serialized = fragment.nodes.map(n => app.serialize(n)).join('\n\n')
        // console.log('Serialized =>', serialized);
        // event.clipboardData.setData('text/plain', serialized);

        // // TODO: sanitize the fragment, remove all ids and references to the old document
        // // keep external references to images, links, etc
        // app.state.runtime.clipboard.setFragment(fragment);

        // delete the selection
        app.cmd.keyboard.backspace(ctx)?.dispatch();
      },
      copy: (ctx: EventContext<any>) => {
        const { event, app } = ctx
        preventAndStop(event);
        console.log('copy', event);
        const fragment = this.fragment(app);
        console.log('fragment', fragment);

        if (!fragment.isEmpty) {
          const serialized = fragment.nodes.map(n => app.serialize(n))
          console.log('Serialized =>', serialized);
          event.clipboardData.setData('text/plain', serialized);

          console.log(fragment.nodes.map(n => n.textContent));

          app.state.runtime.clipboard.setFragment(fragment);
          return
        }
      },
      paste: (ctx: EventContext<any>) => {
        const { event, app } = ctx
        preventAndStop(event);
        const { nodeSelection, selection } = app

        if (!app.state.runtime.clipboard.isEmpty) {
          const { fragment } = app.state.runtime.clipboard;
          app.cmd.transform.paste(selection, fragment)?.dispatch()
        } else {

        }
        console.log('paste', app.state.runtime.clipboard.isEmpty, nodeSelection.isEmpty);
        // if (!app.state.runtime.clipboard.isEmpty) {
        //   const { fragment } = app.state.runtime.clipboard;
        //   const { nodes } = fragment;

        //   // if the selection is not empty, we need to paste the nodes after the last node
        //   if (!nodeSelection.isEmpty) {
        //     const lastNode = last(nodeSelection.nodes) as Node
        //     let focusNode: Optional<Node> = null;
        //     reverse(nodes.slice()).some(n => {
        //       return n.find(n => {
        //         if (n.isTextBlock) {
        //           focusNode = n;
        //           return true;
        //         }
        //         return false;
        //       })
        //     });

        //     const tr = app.tr.insert(Point.toAfter(lastNode.id), nodes)
        //     if (focusNode) {
        //       tr.select(PinnedSelection.fromPin(Pin.toEndOf(focusNode)!))
        //     }
        //     tr.dispatch();
        //     return
        //   }

        //   app.cmd.transform.paste(selection, fragment)?.dispatch()
        //   return
        // }

        // create a fragment from the clipboard data
        // const deserialized = event.clipboardData.getData('text/plain').split('\n\n').map(s => app.deserialize(s));
        // const fragment = Fragment.from(deserialized);
        // app.cmd.transform.paste(selection, fragment)?.dispatch()

        console.log('paste', app.state.runtime.clipboard.fragment.nodes);

        // console.log('paste', event);
      }
    };
  }

  fragment(app: Carbon): Fragment {
    const { selection, nodeSelection } = app;
    console.log(nodeSelection.size);

    if (nodeSelection.size) {
      const { nodes } = nodeSelection;
      return Fragment.from(nodes.map(n => app.schema.cloneWithId(n)), true);
    }

    const { start, end } = selection;
    let [startNode, endNode] = blocksBelowCommonNode(start.node, end.node);

    console.log(startNode, endNode);


    if (!startNode || !endNode) {
      return Fragment.empty;
    }

    if (startNode.isTextBlock) {
      startNode = endNode = startNode.parent;
    }

    if (!startNode || !endNode) {
      return Fragment.empty;
    }

    const nodes = startNode === endNode
      ? [startNode] :
      (startNode?.parent?.children.slice(startNode.index, endNode.index + 1) ?? [])

    const cloned = nodes.map(n => n.clone());

    const rootNode = Node.create({
      type: app.schema.type('document'),
      content: BlockContent.create(cloned),
      id: NodeId.create(String(Math.random())),
    });
    rootNode.content.withParent(rootNode);

    const deleteGroup = new SelectionPatch()
    const startPin = start.down();
    const endPin = end.down();

    if (!startPin || !endPin) {
      return Fragment.empty;
    }

    rootNode.find(n => {
      if (startPin.node.eq(n)) {
        return true;
      }
      if (n.isContainerBlock) {
        deleteGroup.addId(n.id);
      } else if (n.isTextBlock) {
        n.children.map(n => deleteGroup.addId(n.id));
      }
      return false;
    }, {
      order: 'post',
      direction: 'forward',
    });

    rootNode.find(n => {
      if (endPin.node.eq(n)) {
        return true;
      }
      if (n.isContainerBlock) {
        deleteGroup.addId(n.id);
      } else if (n.isTextBlock) {
        n.children.map(n => deleteGroup.addId(n.id));
      }
      return false;
    }, {
      order: 'post',
      direction: 'backward',
    });

    // if the start and end cursor covers a node title entirely, we need to keep the title
    if (start.node !== end.node || !(start.isAtStartOfNode(start.node) && end.isAtEndOfNode(end.node))) {
      if (start.isAtStartOfNode(start.node)) {
        start.node.children.forEach(n => deleteGroup.addId(n.id));
      } else {
        deleteGroup.addRange(Range.create(Pin.toStartOf(start.node)!, start));
      }

      if (end.isAtEndOfNode(end.node)) {
        start.node.children.forEach(n => deleteGroup.addId(n.id));
      } else {
        deleteGroup.addRange(Range.create(end, Pin.toEndOf(end.node)!,));
      }
    }
    // console.log('xxx', rootNode.textContent);

    // console.log(deleteGroup.ids.map(id => id.toString()));
    console.log(deleteGroup.ranges);
    deleteGroup.ranges.reverse()

    // remove the nodes outside the selection
    rootNode.walk(n => {
      if (n === rootNode) return false;
      if (!n.isTextBlock) return false;
      deleteGroup.ranges.forEach(r => {

        console.log(n.textContent);
        if (r.start.node.eq(n)) {
          if (r.end.offset === n.focusSize) {
            // console.log(r, n.textContent, n.textContent.slice(0, r.start.offset));
            const textNode = app.schema.text(n.textContent.slice(0, r.start.offset));
            // console.log('XX',textNode);
            n.updateContent(BlockContent.create([textNode!]))
          } else if (r.start.offset === 0) {
            const textNode = app.schema.text(n.textContent.slice(r.end.offset));
            n.updateContent(BlockContent.create([textNode!]))
          }

          deleteGroup.removeRange(r);
        }
      });

      return false;
    })

    // remove nodes outside the selection
    rootNode.walk(n => {
      if (n === rootNode) return false;
      if (n.isTextBlock) return false;

      if (deleteGroup.has(n.id)) {
        n.parent?.remove(n)
      }
      return false;
    })

    rootNode.find(n => {
      if (n.eq(startNode!)) {
        n.changeType(app.schema.type('section'));
        return true;
      }
      return false;
    });

    // remove nodes and content outside the selection
    return Fragment.from(rootNode.children.map(n => app.schema.cloneWithId(n)));
  }
}
