import { useCallback, useMemo } from "react";
import {
  Carbon,
  CarbonBlock,
  CarbonNodeChildren,
  CarbonNodeContent,
  CollapsedPath,
  Node,
  OpenedPath,
  Point,
  preventAndStop,
  RendererProps,
  stop,
  useCarbon,
  useNodeOpened
} from "@emrgen/carbon-core";

import { BlockEvent } from "../events";
import { HiOutlinePlus } from "react-icons/hi";
import { MdOutlineKeyboardArrowRight } from "react-icons/md";
import { PageTreeItemName, PageTreeName } from "../plugins/PageTree";

const getPageTree = (n: Node) => n.closest(n => n.type.name === PageTreeName);

export const PageTreeItemComp = (props: RendererProps) => {
  const { node } = props;
  const activated = useNodeOpened(props);
  const app = useCarbon();
  const isCollapsed = node.isCollapsed;

  const handleToggle = useCallback((app: Carbon) => {
    app.cmd.toggle(node).dispatch();
  }, [node]);

  // insert a new section as child of this collapsible
  const handleInsert = useCallback(
    (e) => {
      preventAndStop(e);
      const { cmd } = app;

      const pageTree = getPageTree(node);
      if (!pageTree) return;

      cmd
        .pageTree.close(pageTree)
        .pageTreeItem.expand(node);

      const item = app.schema.type(PageTreeItemName).default()!;
      item.updateProps({
        [OpenedPath]: true,
      });

      const at = Point.toAfter(node.child(0)!.id);
      cmd
        .insert(at, item)
        .then(() => {
          return () => app.emit(BlockEvent.openDocumentOverlay, { node: item });
        })
        .dispatch();
    },
    [app, node]
  );

  const handleOpenDocument = useCallback(
    (e) => {
      preventAndStop(e);
      const pageTree = getPageTree(node);
      if (!pageTree) {
        console.warn("page tree not found for node", node.id.toString());
        return;
      }

      app.cmd
        .pageTree.close(pageTree)
        .pageTreeItem.open(node)
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
          onClick={() => handleToggle(app)}
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
        ...activated.attributes,
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
