import {
  AfterPlugin,
  blocksBelowCommonNode,
  Carbon,
  EventContext,
  EventHandlerMap,
  findMatchingNodes,
  Node,
  Path,
  Pin,
  preventAndStop,
  printNode,
  SelectedPath,
  SelectionPatch,
  Slice,
  Span,
  TextWriter,
} from "@emrgen/carbon-core";

import { Optional } from "@emrgen/types";
import { identity, isEmpty } from "lodash";
import { setClipboard } from "../clipboard";
import { parseClipboard } from "../parser/parse";

export class ClipboardPlugin extends AfterPlugin {
  name = "clipboard";

  constructor() {
    super();
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
            {
              type: "web application/carbon",
              data: JSON.stringify(slice.toJSON()),
            },
          ]).catch((e) => {
            console.error("clipboard cut error", e);
          });

          app.runtime.clipboard = slice;
        }

        // delete the selection
        cmd.keyboard.backspace(ctx)?.Dispatch();
      },
      copy: (ctx: EventContext<any>) => {
        const { event, app, cmd } = ctx;
        preventAndStop(event);
        const slice = this.slice(app);
        console.log("slice", slice, slice.isBlockSelection);
        console.log("slice content =>", slice.root.textContent);

        slice.normalize();

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

          app.runtime.clipboard = slice;
          return;
        }
      },
      paste: (ctx: EventContext<any>) => {
        const { event, app } = ctx;
        preventAndStop(event);
        const { selection } = app;
        // if (!app.runtime.clipboard.isEmpty) {
        //   console.log("runtime.clipboard.root", app.runtime.clipboard.root);
        //   const slice = app.runtime.clipboard;
        //   printNode(slice.root);
        //
        //   app.cmd.transform.paste(selection, slice)?.Dispatch();
        // } else {
        parseClipboard(ctx.app.schema).then((slice) => {
          if (isEmpty(slice)) {
            console.log("failed to parse clipboard data");
            return;
          }

          printNode(slice.root);

          app.cmd.transform.paste(selection, slice)?.Dispatch();
        });
        // }
      },
    };
  }

  // slice the selected nodes and remove the nodes outside the selection
  slice(app: Carbon): Slice {
    const { selection, blockSelection } = app.state;
    if (blockSelection.isActive) {
      const { blocks } = blockSelection;
      const cloned = blocks.map((n) => {
        const node = app.schema.clone(n);
        node.updateProps({ [SelectedPath]: false });
        return node;
      });

      const rootNode = app.schema.type("slice").create(cloned)!;

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
        : startNode?.parent?.children.slice(
            startNode.index,
            endNode.index + 1,
          ) ?? [];

    const type = app.schema.type("slice");
    // extract document content matching nodes
    if (!startNode.isDocument) {
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

    const deleteGroup = new SelectionPatch();
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

    deleteGroup.addRange(Span.create(Pin.toStartOf(start.node)!, start));
    deleteGroup.addRange(Span.create(end, Pin.toEndOf(end.node)!));

    // console.log(deleteGroup.ids.map(id => id.toString()));
    // console.log(deleteGroup.ranges);
    deleteGroup.ranges.reverse();

    // remove the ranges outside the selection
    root.walk((n) => {
      if (n === root) return false;
      if (!n.isTextContainer) return false;
      deleteGroup.ranges.forEach((r) => {
        console.log(n.textContent);
        if (r.start.node.eq(n)) {
          if (r.end.offset === n.focusSize) {
            // console.log(r, n.textContent, n.textContent.slice(0, r.start.offset));
            const textNode = app.schema.text(
              n.textContent.slice(0, r.start.offset),
            );
            n.updateContent([textNode!]);
          } else if (r.start.offset === 0) {
            const textNode = app.schema.text(n.textContent.slice(r.end.offset));
            n.updateContent([textNode!]);
          }

          deleteGroup.removeRange(r);
        }
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
