import { title } from "@emrgen/carbon-blocks";
import { EventsOut, Node, State } from "@emrgen/carbon-core";
import {
  useCombineConnectors,
  useConnectorsToProps,
  useDragDropRectSelect,
} from "@emrgen/carbon-dragon-react";
import {
  CarbonBlock,
  CarbonNode,
  InitNodeJSON,
  RendererProps,
  useCarbon,
  useSelectionHalo,
} from "@emrgen/carbon-react";
import { Optional } from "@emrgen/types";
import { useCallback, useEffect, useRef, useState } from "react";

const createBlockContentItem = (id: string, content?: string) => {
  return {
    name: "paragraph",
    attrs: {
      node: { tag: "a" },
      html: { href: "#" + id },
    },
    content: [title([{ name: "text", text: content ?? "Untitled" }])],
  };
};

const appendContent = (parent: any, child: any) => {
  parent.content.push(child);
};

export function BlockContentComp(props: RendererProps) {
  const { node } = props;
  const app = useCarbon();
  const ref = useRef(null);

  const selection = useSelectionHalo(props);
  const dragDropRect = useDragDropRectSelect({ node, ref });
  const connectors = useConnectorsToProps(useCombineConnectors(dragDropRect, selection));

  const [content, setContent] = useState<Optional<Node>>(null);

  const updateContent = useCallback(
    (content: Node) => {
      // const getHeaderType = (node: Node): Optional<NodeType> => {
      //   const { type } = node;
      //   const as = node.props.html["data-as"] ?? "";
      //   const asType = type.schema.nodes[as];
      //   if (type.groups.includes("heading")) {
      //     return type
      //   }
      //   if (asType?.groups.includes("heading")) {
      //     return asType
      //   }
      //
      //   return null
      // }

      // const traverse = (node: Node, content: InitNodeJSON) => {
      //   if (isHeaderNode(node)) {
      //     const item = createBlockContentItem(node.id.toString(), node.firstChild?.textContent ?? 'Untitled')
      //     content.children?.push(item)
      //     node.children.forEach(n => {
      //       traverse(n, item);
      //     })
      //     console.log('-> found a header node', node.id.toString());
      //   } else {
      //     node.children.forEach(n => {
      //       traverse(n, content)
      //     })
      //   }
      // }

      const blockContentNode: InitNodeJSON = {
        name: "stack",
        children: [],
        level: 0,
      };
      // build the block content tree

      const { children } = content;
      let prevHeaderLevel = 1;
      const levelStack = [blockContentNode];
      const peek = () => levelStack[levelStack.length - 1] as InitNodeJSON;
      const pop = () => {
        if (levelStack.length == 1) return peek();
        return levelStack.pop() as InitNodeJSON;
      };

      // for (const ch of children) {
      //   const type = getHeaderType(ch)
      //   if (type) {
      //     const level = (react.plugin(type.name) as Heading).level ?? 0;
      //     if (level == 0) continue;
      //
      //     while (level <= prevHeaderLevel) {
      //       prevHeaderLevel = pop().level
      //     }
      //
      //     if (level < prevHeaderLevel) {
      //
      //     } else if (level === prevHeaderLevel) {
      //       // peek().children.push(createBlockContentItem(ch.id.toString(), ch.firstChild?.textContent))
      //     }
      //
      //     prevHeaderLevel = level
      //   }
      // }
    },
    [app.content, app.schema],
  );

  useEffect(() => {
    const onChange = (state: State) => {
      if (state.isContentChanged) {
        const parentId = node.parent?.id;
        if (!parentId) return;
        const parent = state.nodeMap.get(parentId);
        let childrenUpdated = false;
        parent?.preorder((n) => {
          if (state.updated.has(n.id)) {
            childrenUpdated = true;
          }
          return childrenUpdated;
        });

        if (parent && childrenUpdated) {
          updateContent(parent);
        }
      }
    };

    app.on(EventsOut.changed, onChange);
    return () => {
      app.off(EventsOut.changed, onChange);
    };
  }, [app, node, updateContent]);

  useEffect(() => {
    const parent = node.parent;
    if (!parent) return;
    updateContent(parent);
  }, [node.parent, updateContent]);

  return (
    <CarbonBlock node={node} ref={ref} custom={connectors}>
      {!content && <div className="empty-content-text">Add heading to create a content list</div>}
      {content && (
        <div className="content">
          <CarbonNode node={content} />
        </div>
      )}
      {selection.SelectionHalo}
    </CarbonBlock>
  );
}
