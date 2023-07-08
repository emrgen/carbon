import { AfterPlugin, BeforePlugin, BlockContent, Carbon, EventContext, EventHandlerMap, Node, Pin } from "../core";
import { SelectionPatch } from "../core/DeleteGroup";
import { NodeId } from "../core/NodeId";
import { Range } from "../core/Range";
import { Slice } from "../core/Slice";
import { preventAndStop } from "../utils/event";
import { blocksBelowCommonNode } from "../utils/findNodes";

export class ClipboardPlugin extends AfterPlugin {
  name = "clipboard";

  on(): EventHandlerMap {
    return {
      cut: (ctx: EventContext<any>) => {
        const { event, app } = ctx
        preventAndStop(event);
        const slice = this.slice(app);
        if (!slice.isEmpty) {
          const serialized = app.serialize(slice.root)
          console.log('Serialized =>', serialized);
          event.clipboardData.setData('text/plain', serialized);

          app.state.runtime.clipboard.setSlice(slice);
        }
        // delete the selection
        app.cmd.keyboard.backspace(ctx)?.dispatch();
      },
      copy: (ctx: EventContext<any>) => {
        const { event, app } = ctx
        preventAndStop(event);
        console.log('copy', event);
        const slice = this.slice(app);
        console.log('slice', slice);

        if (!slice.isEmpty) {
          const serialized = app.serialize(slice.root)
          console.log('Serialized =>', serialized);
          event.clipboardData.setData('text/plain', serialized);

          console.log(slice.root.children.map(n => n.textContent));

          app.state.runtime.clipboard.setSlice(slice);
          return
        }
      },
      paste: (ctx: EventContext<any>) => {
        const { event, app } = ctx
        preventAndStop(event);
        const { selection, blockSelection } = app

        if (!app.state.runtime.clipboard.isEmpty) {
          const { slice } = app.state.runtime.clipboard;
          app.cmd.transform.paste(selection, blockSelection, slice)?.dispatch()
        } else {

        }
        console.log('paste', app.state.runtime.clipboard.slice.root);
      }
    };
  }

  slice(app: Carbon): Slice {
    const { selection, blockSelection: nodeSelection } = app;
    console.log(nodeSelection.size);

    if (nodeSelection.size) {
      const { blocks } = nodeSelection;
      const cloned = blocks.map(n => {
        const node = app.schema.cloneWithId(n)
        node.updateData({ state: { selected: false } })
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
    let [startNode, endNode] = blocksBelowCommonNode(start.node.parent!, end.node.parent!);
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
    console.log('cloned', cloned.map(n => n.name));

    const rootNode = Node.create({
      type: app.schema.type('slice'),
      content: BlockContent.create(cloned),
      id: NodeId.create(String(Math.random())),
    });
    rootNode.content.withParent(rootNode);
    console.log('rootNode', rootNode);

    const deleteGroup = new SelectionPatch()
    const startPin = start.down();
    const endPin = end.down();

    if (!startPin || !endPin) {
      return Slice.empty;
    }

    rootNode.find(n => {
      console.log(n.name, n.textContent);

      if (startPin.node.eq(n)) {
        console.log('xxxx');

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

    let startPath: number[] = [];
    let endPath: number[] = [];
    rootNode.forAll(n => {
      if (n.eq(start.node)) {
        startPath = n.path
      }
      if (n.eq(end.node)) {
        endPath = n.path
      }
    })

    console.log('xxx', rootNode);

    const children = rootNode.children.map(n => app.schema.cloneWithId(n));
    rootNode.updateContent(BlockContent.create(children));

    const startSliceNode = rootNode.atPath(startPath);
    const endSliceNode = rootNode.atPath(endPath);

    if (!startSliceNode || !endSliceNode) {
      throw Error('failed to get start and end slice node')
    }

    console.log(startSliceNode.chain.map(n => n.type.name).join(' > '));
    console.log('rootNode.children', rootNode.children);
    console.log(startSliceNode.textContent, endSliceNode.textContent);

    // remove nodes and content outside the selection
    return Slice.create(rootNode, startSliceNode, endSliceNode);
  }
}
