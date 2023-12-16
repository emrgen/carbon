import { useCallback, useEffect, useMemo } from "react";
import {
  ActionOrigin,
  CarbonNodeChildren,
  Pin,
  PinnedSelection,
  Point,
  preventAndStop,
  useCarbon,
  useSelectionHalo,
  CarbonBlock,
  CarbonChildren,
  CarbonNodeContent,
  RendererProps,
  EventsOut,
  stop,
  useNodeStateChange, Node, PointedSelection
} from "@emrgen/carbon-core";

import { BlockEvent } from "../events";
import { HiOutlinePlus } from "react-icons/hi";
import {
  MdOutlineKeyboardArrowDown,
  MdOutlineKeyboardArrowRight,
} from "react-icons/md";
import { PageTreeItemName, PageTreeName } from "../plugins/PageTree";
import { usePrevious } from "@uidotdev/usehooks";

export const PageTreeItemComp = (props: RendererProps) => {
  const { node, placeholder } = props;
  const { attributes, isOpened } = useNodeStateChange(props);
  const app = useCarbon();
  const isCollapsed = node.isCollapsed;

  // const { listeners } = useDragDropRectSelect({ node, ref });
  // console.log(node.textContent);
  // console.log(attributes, isOpen);
  // console.log(node.attrs.node.emptyPlaceholder, node.name);

  const handleToggle = useCallback(() => {
    app.tr
      .updateAttrs(node.id, { node: { collapsed: !isCollapsed } })
      .dispatch();
  }, [app.tr, node, isCollapsed]);

  // insert a new section as child of this collapsible
  const handleInsert = useCallback(
    (e) => {
      preventAndStop(e);

      const item = app.schema.type(PageTreeItemName).default()!;
      item.updateState({ opened: true })
      const at = Point.toAfter(node.child(0)!.id);
      console.log(item, at);
      app.tr
        .updateAttrs(node.id, { node: { collapsed: false } })
        .insert(at, item)
        // .then(() => {
        //   return () => app.emit(BlockEvent.openDocumentOverlay, { node: item });
        // })
        .dispatch();
    },
    [app, node]
  );

  const handleOpenDocument = useCallback(
    (e) => {
      preventAndStop(e);
      const {state, tr} = app;

      const getFileTree = (n: Node) => n.closest(n => n.type.name === PageTreeName);

      const fileTree = getFileTree(node);
      if (!fileTree) return;

      // find all opened file tree items with the same file tree
      const openFileTreeItems = state.changes.state.nodes(state.nodeMap)
        .filter(n => n.type.name === node.type.name)
        .filter(n => n.state.opened);

      // close all other opened file tree items
      if (openFileTreeItems.length > 0) {
        if (openFileTreeItems[0].id === node.id) return;

        openFileTreeItems.forEach(n => {
          tr.updateState(n.id, {
            opened: false,
          })
        })
      }

      tr
        .updateState(node.id, {
          opened: true,
        })
        .then(() => {
          return () => app.emit(BlockEvent.openDocument, { node });
        })
        .dispatch();
    },
    [app, node]
  );

  const beforeContent = useMemo(() => {
    return (
      <>
        <div
          className={"carbon-collapsible__control" + (isCollapsed ? " collapsed" : " expanded")}
          contentEditable="false"
          suppressContentEditableWarning
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onClick={handleToggle}
        >
          <MdOutlineKeyboardArrowRight className={'page-tree-open-close-icon'}/>
        </div>
        <div
          className="add-child-file"
          onClick={handleInsert}
          onMouseDown={preventAndStop}
        >
          <HiOutlinePlus />
        </div>
      </>
    );
  }, [handleInsert, handleToggle, isCollapsed]);

  return (
    <CarbonBlock
      node={node}
      custom={{
        ...attributes,
      }}
    >
      {!node.isEmpty && (
        <CarbonNodeContent
          node={node}
          beforeContent={beforeContent}
          custom={{ onClick: handleOpenDocument }}
        />
      )}
      {node.isEmpty && (
        <div data-type="content" onMouseDown={stop}>
          {beforeContent}
          <div
            data-name="title"
            onClick={handleOpenDocument}
            onMouseDown={stop}
          >
            <span>Untitled</span>
          </div>
        </div>
      )}
      {/* <CarbonNodeContent node={node} beforeContent={beforeContent} custom={{contentEditable: isActive}}/> */}
      {!isCollapsed && <CarbonNodeChildren node={node} />}
      {!isCollapsed && node.size === 1 && (
        <div className="carbon-collapsible__empty">No page inside</div>
      )}
    </CarbonBlock>
  );
};
