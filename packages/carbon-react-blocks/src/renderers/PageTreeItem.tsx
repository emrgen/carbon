import { useCallback, useMemo } from "react";
import {
  Carbon, 
  Node, preventAndStop, OpenedPath, Point,
} from "@emrgen/carbon-core";

import { HiOutlinePlus } from "react-icons/hi";
import { MdOutlineKeyboardArrowRight } from "react-icons/md";
import {CarbonBlock, CarbonNodeChildren, CarbonNodeContent, RendererProps, useCarbon, useNodeOpened} from "@emrgen/carbon-react";
import {BlockEvent, PageTreeItemName, PageTreeName} from "@emrgen/carbon-blocks";

const getPageTree = (n: Node) => n.closest(n => n.type.name === PageTreeName);

export const PageTreeItemComp = (props: RendererProps) => {
  const { node } = props;
  const activated = useNodeOpened(props);
  const app = useCarbon();
  const isCollapsed = node.isCollapsed;

  const handleToggle = useCallback((app: Carbon) => {
    app.cmd.collapsible.toggle(node).Dispatch();
  }, [node]);

  // insert a new section as child of this collapsible and open it
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
        .Insert(at, item)
        .Then(() => {
          return () => app.emit(BlockEvent.openDocumentOverlay, { node: item });
        })
        .Dispatch();
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
        .Then(() => {
          return () => app.emit(BlockEvent.openDocument, { node });
        })
        .Dispatch();
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
  }, [app, handleInsert, handleToggle, isCollapsed]);

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
          // custom={{ onClick: handleOpenDocument }}
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
