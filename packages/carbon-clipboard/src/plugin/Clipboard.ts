import {CarbonCodec} from "@emrgen/carbon-codec";
import {
  AfterPlugin,
  blocksBelowCommonNode,
  CarbonEditor,
  CarbonPlugin,
  DeletePatch,
  EventContext,
  EventHandlerMap,
  findMatchingNodes,
  Node,
  NodeId,
  NodeIdComparator,
  NodeSpan,
  Path,
  Pin,
  preventAndStop,
  preventAndStopCtx,
  printNode,
  SelectedPath,
  Slice,
  SliceNode,
  TextWriter,
  TitleNode,
} from "@emrgen/carbon-core";

import {Optional} from "@emrgen/types";
import {identity, isEmpty} from "lodash";

import BTree from "sorted-btree";
import {setClipboard} from "../clipboard";
import {parseClipboard} from "../parser/parse";

let cache: any = null;
let clipboard: any = null;

export class ClipboardPlugin extends AfterPlugin {
  name = "clipboard";

  constructor() {
    super();
  }

  plugins(): CarbonPlugin[] {
    return [new CarbonCodec()];
  }

  handlers(): EventHandlerMap {
    return {
      cut: (ctx: EventContext<any>) => {
        const { event, app, cmd } = ctx;
        preventAndStop(event);
        const slice = this.slice(app);
        slice.normalize();

        if (!slice.isEmpty) {
          const writer = new TextWriter();
          app.encode(writer, slice.root);

          const html = new TextWriter();
          app.encodeHtml(html, slice.root);

          setClipboard([
            {
              type: "text/plain",
              data: writer.toString(),
            },
            {
              type: "text/html",
              data: html.buildHtml(),
            },
            // {
            //   type: "web application/carbon",
            //   data: JSON.stringify(slice.toJSON()),
            // },
          ]).catch((e) => {
            console.error("clipboard cut error", e);
          });

          // app.runtime.clipboard = slice;
        }

        // delete the selection
        cmd.keyboard.backspace(ctx)?.Dispatch();
      },
      copy: (ctx: EventContext<any>) => {
        const { event, app, cmd } = ctx;
        preventAndStop(event);
        const slice = this.slice(app);
        console.log("slice", slice.toJSON(), slice.isBlockSelection);
        console.log("slice content =>", slice.root.textContent);

        slice.normalize();

        console.log("normalized slice", slice.toJSON(), slice.isBlockSelection);
        if (!slice.isEmpty) {
          const writer = new TextWriter();
          app.encode(writer, slice.root);

          const html = new TextWriter();
          app.encodeHtml(html, slice.root);
          console.log("html", html.toString());

          setClipboard([
            {
              type: "text/plain",
              data: writer.toString(),
            },
            {
              type: "text/html",
              data: html.buildHtml(),
            },
            {
              type: "web application/carbon",
              data: JSON.stringify(slice.toJSON()),
            },
          ]).catch((e) => {
            console.error("clipboard copy error", e);
          });

          // app.runtime.clipboard = slice;
          return;
        }
      },
      paste: (ctx: EventContext<any>) => {
        const { app } = ctx;
        preventAndStopCtx(ctx);
        const { selection } = app;
        if (cache) {
          const cmd = app.cmd.transform.paste(selection, cache.clone());
          return;
        }

        parseClipboard(ctx.app.schema).then((slice) => {
          if (isEmpty(slice)) {
            cache = null;
            console.log("failed to parse clipboard data");
            return;
          }
          cache = slice;

          printNode(slice.root);

          app.cmd.transform.paste(selection, slice.clone()).Dispatch();
        });
      },
      keyUp: (ctx: EventContext<any>) => {
        cache = null;
      },
    };
  }

  // slice the selected nodes and remove the nodes outside the selection
  slice(app: CarbonEditor): Slice {
    const { selection, blockSelection } = app.state;
    if (blockSelection.isActive) {
      const { blocks } = blockSelection;
      const cloned = blocks.map((n) => {
        const node = app.schema.clone(n);
        node.updateProps({ [SelectedPath]: false });
        return node;
      });

      const rootNode = app.schema.type("slice").create(cloned)!;
      console.log(rootNode.toJSON());

      const first = rootNode.firstChild!;
      const last = rootNode.lastChild!;
      return Slice.create(rootNode, first, last);
    }

    const { start, end } = selection;
    let [startNode, endNode] = blocksBelowCommonNode(
      start.node.parent!,
      end.node.parent!,
    ) as [Optional<Node>, Optional<Node>];
    if (!startNode || !endNode) {
      return Slice.empty;
    }

    let matches: Node[] = [];

    if (startNode.isTextContainer && startNode.eq(endNode)) {
      startNode = endNode = startNode.parent;
    }
    if (!startNode || !endNode) {
      return Slice.empty;
    }

    const nodes =
      startNode === endNode
        ? [startNode]
        : (startNode?.parent?.children.slice(
            startNode.index,
            endNode.index + 1,
          ) ?? []);

    const type = app.schema.type(SliceNode.kind);
    // extract page content matching nodes
    if (!startNode.isPage) {
      const match = findMatchingNodes(matches, type.contentMatch, nodes, []);

      if (!match.validEnd) {
        return Slice.empty;
      }

      console.log(
        "match",
        match.validEnd,
        matches.map((n) => n.name),
        type.contentMatch,
        nodes.map((n) => n.name),
      );
    } else {
      matches = nodes;
    }

    // create clone of selected nodes
    // the ids are cloned as well, so that we can remove the nodes outside the selection
    const cloned: Node[] = matches.map((n) => app.schema.clone(n, identity));
    // console.log('cloned', cloned.map(n => n.name));

    const root = type.create(cloned)!;

    console.log("rootNode", root);

    const deleteGroup = DeletePatch.default();
    const startPin = start.down();
    const endPin = end.down();

    if (!startPin || !endPin) {
      return Slice.empty;
    }

    // delete nodes is before start pin
    root.find(
      (n) => {
        // console.log(n.name, n.textContent);
        if (startPin.node.eq(n)) {
          return true;
        }
        if (n.isContainer) {
          deleteGroup.addId(n.id);
        } else if (n.isTextContainer) {
          n.children.map((n) => deleteGroup.addId(n.id));
        }
        return false;
      },
      {
        order: "post",
        direction: "forward",
      },
    );

    // delete nodes is after end pin
    root.find(
      (n) => {
        if (endPin.node.eq(n)) {
          return true;
        }
        if (n.isContainer) {
          deleteGroup.addId(n.id);
        } else if (n.isTextContainer) {
          n.children.map((n) => deleteGroup.addId(n.id));
        }
        return false;
      },
      {
        order: "post",
        direction: "backward",
      },
    );

    // collect spans that falls outside the selection, so that we can remove them later
    deleteGroup.addRange(
      NodeSpan.create(Pin.toStartOf(start.node)?.up()!, start),
    );
    deleteGroup.addRange(NodeSpan.create(end, Pin.toEndOf(end.node)?.up()!));

    // console.log(deleteGroup.ids.map(id => id.toString()));
    // console.log(deleteGroup.ranges);

    // TODO: check if we really need to reverse the ranges
    deleteGroup.ranges.reverse();

    console.log(
      "deleteGroup",
      deleteGroup.ranges.map((r) => r.start.node.textContent),
    );
    console.log(
      "deleteGroup",
      deleteGroup.ranges.map((r) => [r.start.offset, r.end.offset]),
    );

    // create a map of spans to remove the content within the span
    const spanMap = new BTree<NodeId, NodeSpan[]>(undefined, NodeIdComparator);
    deleteGroup.ranges.forEach((r) => {
      const spans = spanMap.get(r.start.node.id) ?? [];
      spans.push(r);
      spanMap.set(r.start.node.id, spans);
    });

    // remove the content within the span for text containers
    root.walk((n) => {
      if (n === root) return false;
      if (!n.isTextContainer) return false;

      const spans = spanMap.get(n.id);
      spans?.forEach((span) => {
        const content = TitleNode.from(n)
          .remove(span.start.steps, span.end.steps)
          .normalize();
        console.log(
          "remove content",
          start.node.textContent,
          start.offset,
          end.offset,
        );

        n.updateContent(content.children);
      });

      return false;
    });

    // remove nodes outside the selection
    root.walk((n) => {
      if (n === root) return false;
      if (n.isTextContainer) return false;

      if (deleteGroup.has(n.id)) {
        n.parent?.remove(n);
      }
      return false;
    });

    let startPath: Path = [];
    let endPath: Path = [];
    root.all((n) => {
      if (n.eq(start.node)) {
        startPath = n.path;
      }
      if (n.eq(end.node)) {
        endPath = n.path;
      }
    });

    const startSliceNode = root.atPath(startPath);
    const endSliceNode = root.atPath(endPath);

    if (!startSliceNode || !endSliceNode) {
      throw Error("failed to get start and end slice node");
    }

    // remove nodes and content outside the selection
    return Slice.create(root, startSliceNode, endSliceNode);
  }
}
