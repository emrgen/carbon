import {
  CarbonBlock,
  CarbonNode,
  EventsOut,
  Node,
  NodeType,
  RendererProps,
  Transaction,
  extensionPresets,
  useCarbon,
  useCreateCarbon,
  useSelectionHalo,
} from "@emrgen/carbon-core";
import {
  useCombineConnectors,
  useConnectorsToProps,
  useDragDropRectSelect,
} from "@emrgen/carbon-dragon";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Optional } from "@emrgen/types";
import { title } from "../create";
import { last } from "lodash";

const createContent = (id: string, content?: string) => {
  return {
    name: "section",
    attrs: {
      node: { tag: "a" },
      html: { href: '#' + id },
    },
    content: [title([{ name: "text", text: content || "Untitled" }])],
  };
};

const appendContent = (parent: any, child: any) => {
  parent.content.push(child);
};

export function ContentComp(props: RendererProps) {
  const { node } = props;
  const app = useCarbon();
  const ref = useRef(null);

  const selection = useSelectionHalo(props);
  const dragDropRect = useDragDropRectSelect({ node, ref });
  const connectors = useConnectorsToProps(
    useCombineConnectors(dragDropRect, selection)
  );

  const [content, setContent] = useState<Optional<Node>>(null);

  const updateContent = useCallback(() => {
    const stack: { text: string; depth: number; id: string }[] = [];
    const levels: { node: any; depth: number }[] = [];
    const stackNode = {
      name: "stack",
      children: [],
    };
    // const names = app.content
    //   .find((n) => n.isDocument)
    //   ?.children.map((n) => n.type.groups);
    //   console.log("names", names);

    app.content
      .find((n) => n.isDocument)
      ?.children.forEach((node) => {
        const as = node.attrs.html["data-as"] ?? "";
        const type: Optional<NodeType> = app.schema.nodes[as];

        if (
          node.type.groups.includes("heading") ||
          type?.groups.includes("heading")
        ) {
          // console.log(
          //   "node",
          //   node.name,
          //   node.type.groups.includes("heading"),
          //     type?.groups.includes("heading"),
          //     type
          // );

          const level = parseInt(as ? as.slice(-1) : node.type.name.slice(-1));
          console.log("level", level);
          stack.push({
            text: node.child(0)?.textContent ?? "Untitled",
            depth: level,
            id: node.id.toString(),
          });
        }
      });

      // console.log(stack);


    // console.log(stack.map(s => s.depth));
    if (stack.length > 0) {
      stack.forEach((item, index) => {
        const content = createContent(item.id, item.text);
        if (index === 0) {
          appendContent(stackNode, content);
        } else {
          while (levels.length && last(levels)!.depth >= item.depth) {
            levels.pop();
          }

          if (levels.length) {
            appendContent(last(levels)!.node, content);
          } else {
            appendContent(stackNode, content);
          }
        }

        levels.push({ node: content, depth: item.depth });
      });

      // console.log("stackNode", stackNode);
      setContent(app.schema.nodeFromJSON(stackNode)!);
    } else {
      setContent(null);
    }
  }, [app.content, app.schema]);

  console.log(content);


  useEffect(() => {
    const onTransaction = (tr: Transaction) => {
      if (tr.updatesContent) {
        updateContent();
      }
    };

    app.on(EventsOut.transactionCommit, onTransaction);
    return () => {
      app.off(EventsOut.transactionCommit, onTransaction);
    };
  }, [app, updateContent]);

  useEffect(() => {
    updateContent();
  }, [updateContent]);

  return (
    <CarbonBlock node={node} ref={ref} custom={connectors}>
      {!content && (
        <div className="empty-content-text">
          Add heading to create a content list
        </div>
      )}
      {content && (
        <div className="content">
          <CarbonNode node={content} />
        </div>
      )}
      {selection.SelectionHalo}
    </CarbonBlock>
  );
}
