import { AfterPlugin, BlockContent, Carbon, EventContext, EventHandlerMap, Node, Pin } from "../core";
import { SelectionPatch } from "../core/DeleteGroup";
import { NodeId } from "../core/NodeId";
import { Range } from "../core/Range";
import { Slice } from "../core/Slice";
import { preventAndStop } from "../utils/event";
import { blocksBelowCommonNode } from "../utils/findNodes";
import { SelectedPath } from "../core/NodeProps";
import {Optional} from "@emrgen/types";

export class ClipboardPlugin extends AfterPlugin {
  name = "clipboard";

  handlers(): EventHandlerMap {
    return {
      cut: (ctx: EventContext<any>) => {
        const { event, app, cmd } = ctx
        preventAndStop(event);
        const slice = this.slice(app);
        if (!slice.isEmpty) {
          // const serialized = react.serialize(slice.root)
          // console.log('Serialized =>', serialized);
          // event.clipboardData.setData('text/plain', serialized);

          // react.state.changes.clipboard = slice;
        }
        // delete the selection
        cmd.keyboard.backspace(ctx)?.Dispatch();
      },
      copy: (ctx: EventContext<any>) => {
        const { event, app, cmd } = ctx
        preventAndStop(event);
        console.log('copy', event);
        const slice = this.slice(app);
        console.log('slice', slice);

        if (!slice.isEmpty) {
          // const serialized = react.serialize(slice.root)
          // console.log('Serialized =>', serialized);
          // event.clipboardData.setData('text/plain', serialized);
          console.log(slice.root.children.map(n => n.textContent));
          app.runtime.clipboard = slice;
          return
        }
      },
      paste: (ctx: EventContext<any>) => {
        const { event, app } = ctx
        preventAndStop(event);
        const { selection } = app

        // if (!react.state.changes.clipboard.size === 0) {
        //   const slice = react.state.changes.clipboard;
        //   react.cmd.transform.paste(selection, slice)?.Dispatch()
        // } else {
        //
        // }
        console.log('paste', app.runtime.clipboard.root);
      }
    };
  }

  slice(app: Carbon): Slice {
    const { selection,  } = app;
    if (selection.isBlock) {
      const { blocks } = selection;
      const cloned = blocks.map(n => {
        const node = app.schema.cloneWithId(n)
        node.updateProps({ [SelectedPath]: false })
        return node
      })

      const rootNode = Node.create({
        type: app.schema.type('slice'),
        content: BlockContent.create(cloned),
        id: NodeId.create(String(Math.random())),
      });

      const first = rootNode.firstChild!;
      const last = rootNode.lastChild!;
      return Slice.create(rootNode, first, last);
    }

    const { start, end } = selection;
    let [startNode, endNode] = blocksBelowCommonNode(start.node.parent!, end.node.parent!) as [Optional<Node>, Optional<Node>];
    if (!startNode || !endNode) {
      return Slice.empty;
    }
    // console.log(startNode.id.toString(), endNode.id.toString());
    // console.log(startNode, endNode);

    if (startNode.isTextBlock && startNode.eq(endNode)) {
      startNode = endNode = startNode.parent;
    }
    if (!startNode || !endNode) {
      return Slice.empty;
    }

    const nodes = startNode === endNode
      ? [startNode] :
      (startNode?.parent?.children.slice(startNode.index, endNode.index + 1) ?? [])

    const cloned = nodes.map(n => n.clone());
    // console.log('cloned', cloned.map(n => n.name));

    const root = Node.create({
      id: NodeId.create(String(Math.random())),
      type: app.schema.type('slice'),
      content: BlockContent.create(cloned),
    });
    root.content.setParentId(root.id);
    console.log('rootNode', root);

    const deleteGroup = new SelectionPatch()
    const startPin = start.down();
    const endPin = end.down();

    if (!startPin || !endPin) {
      return Slice.empty;
    }

    root.find(n => {
      console.log(n.name, n.textContent);

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

    root.find(n => {
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
    // if (!(start.isAtStart && end.isAtEnd)) {
    // delete range is before start pin
    // if (start.isAtEndOfNode(start.node)) {
    //   start.node.children.forEach(n => deleteGroup.addId(n.id));
    // } else {
    //   deleteGroup.addRange(Range.create(Pin.toStartOf(start.node)!, start));
    // }

    // delete range is after end pin
    // if (end.isAtStartOfNode(end.node)) {
    //   start.node.children.forEach(n => deleteGroup.addId(n.id));
    // } else {
    //   deleteGroup.addRange(Range.create(end, Pin.toEndOf(end.node)!,));
    // }

    deleteGroup.addRange(Range.create(Pin.toStartOf(start.node)!, start));
    deleteGroup.addRange(Range.create(end, Pin.toEndOf(end.node)!,));
    // }

    // console.log(deleteGroup.ids.map(id => id.toString()));
    console.log(deleteGroup.ranges);
    deleteGroup.ranges.reverse()

    // remove the nodes outside the selection
    root.walk(n => {
      if (n === root) return false;
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
    root.walk(n => {
      if (n === root) return false;
      if (n.isTextBlock) return false;

      if (deleteGroup.has(n.id)) {
        n.parent?.remove(n)
      }
      return false;
    })

    let startPath: number[] = [];
    let endPath: number[] = [];
    root.forAll(n => {
      if (n.eq(start.node)) {
        startPath = n.path
      }
      if (n.eq(end.node)) {
        endPath = n.path
      }
    })

    const children = root.children.map(n => app.schema.cloneWithId(n));
    root.updateContent(BlockContent.create(children));

    const startSliceNode = root.atPath(startPath);
    const endSliceNode = root.atPath(endPath);

    if (!startSliceNode || !endSliceNode) {
      throw Error('failed to get start and end slice node')
    }

    console.log(startSliceNode.chain.map(n => n.type.name).join(' > '));
    console.log('rootNode.children', root.children);
    console.log(startSliceNode.textContent, endSliceNode.textContent);

    // remove nodes and content outside the selection
    return Slice.create(root, startSliceNode, endSliceNode);
  }
}
