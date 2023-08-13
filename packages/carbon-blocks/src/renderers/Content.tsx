import {
  CarbonBlock,
  CarbonNode,
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
import React, { useEffect, useRef, useState } from "react";
import { Optional } from "@emrgen/types";
import { title } from "../create";

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

  useEffect(() => {
    const onTransaction = (tr: Transaction) => {
      const stack: any[] = [];

      if (tr.updatesContent) {
        app.content.find(n => n.isDocument)?.children.forEach((node) => {
          const as = node.attrs.html["data-as"] ?? "";
          const type: Optional<NodeType> = app.schema.nodes[as];
          if (
            node.type.groups.includes("heading") ||
            type?.groups.includes("heading")
          ) {
            console.log('node', node);
            
            const level = parseInt(
              as ? as.slice(-1) : node.type.name.slice(-1)
            );
            console.log("level", level);
            stack.push({ text: node.child(0)?.textContent, depth: level });
          }
        });

        if (stack.length > 0) {
          console.log("stack", stack);
          const root: any = {
            name: "section",
          }

          stack.forEach((item: any, index) => {
            if (index === 0) {
              root.content = [
                title([{ name: "text", text: item.text }])
              ]
            } else {
              root.content.push({
                name: "section",
                content: [title([{ name: "text", text: item.text }])],
              });
            }
          })

          console.log('root', root);
          setContent(app.schema.nodeFromJSON(root)!);
        } else {
          setContent(null);
        }
      }
    };
    app.on("transaction", onTransaction);

    return () => {
      app.off("transaction", onTransaction);
    };
  }, [app]);

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
