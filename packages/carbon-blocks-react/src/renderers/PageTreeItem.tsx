import {
  BlockEvent,
  PageTreeItemName,
  PageTreeName,
} from "@emrgen/carbon-blocks";
import {
  Carbon,
  ContenteditablePath,
  FocusEditablePath,
  LocalDirtyCounterPath,
  Node,
  OpenedPath,
  Pin,
  PinnedSelection,
  Point,
  preventAndStop,
} from "@emrgen/carbon-core";
import {
  CarbonBlock,
  CarbonNodeChildren,
  CarbonNodeContent,
  RendererProps,
  useCarbon,
  useNodeChange,
  useNodeOpened,
} from "@emrgen/carbon-react";
import { useCallback, useMemo } from "react";

import { HiOutlinePencil, HiOutlinePlus } from "react-icons/hi";
import { MdOutlineKeyboardArrowRight } from "react-icons/md";

const getPageTree = (n: Node) => n.closest((n) => n.type.name === PageTreeName);

export const PageTreeItemComp = (props: RendererProps) => {
  const { node } = props;
  const activated = useNodeOpened(props);
  const app = useCarbon();
  const isCollapsed = node.isCollapsed;
  const isContentEditable = node.firstChild?.props.get(ContenteditablePath);
  useNodeChange({ node: node.firstChild! });

  const handleToggle = useCallback(
    (app: Carbon) => {
      app.cmd.collapsible.toggle(node).Dispatch();
    },
    [node],
  );

  // insert a new paragraph as child of this collapsible and open it
  const handleInsert = useCallback(
    (e) => {
      preventAndStop(e);
      const { cmd } = app;

      const pageTree = getPageTree(node);
      if (!pageTree) return;

      cmd.pageTree.close(pageTree).pageTreeItem.expand(node);

      const item = app.schema.type(PageTreeItemName).default()!;
      item.firstChild?.updateContent([app.schema.text("Untitled")!]);
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
    [app, node],
  );

  const handleEditName = useCallback(
    (e) => {
      preventAndStop(e);
      const { cmd } = app;
      cmd
        .Update(node.firstChild!, {
          [ContenteditablePath]: true,
          [FocusEditablePath]: true,
        })
        .Update(node, {
          [LocalDirtyCounterPath]: new Date().getTime(),
        });

      if (!node.firstChild?.isEmpty) {
        cmd.Select(
          PinnedSelection.create(
            Pin.toStartOf(node.firstChild!)!,
            Pin.toEndOf(node.firstChild!)!,
          )!,
        );
      } else {
      }
      cmd.Dispatch();
    },
    [app, node],
  );

  const handleOpenDocument = useCallback(
    (e) => {
      preventAndStop(e);
      const pageTree = getPageTree(node);
      if (!pageTree) {
        console.warn("page tree not found for node", node.id.toString());
        return;
      }

      app.cmd.pageTree
        .close(pageTree)
        .pageTreeItem.open(node)
        .Then(() => {
          return () => app.emit(BlockEvent.openDocument, { node });
        })
        .Dispatch();
    },
    [app, node],
  );

  const beforeContent = useMemo(() => {
    return (
      <>
        <div
          className={
            "page-tree__collapsible_control" +
            (isCollapsed ? " collapsed" : " expanded")
          }
          contentEditable="false"
          suppressContentEditableWarning
          onMouseDown={(e) => {
            preventAndStop(e);
          }}
          onClick={(e) => {
            preventAndStop(e);
            handleToggle(app);
          }}
          style={{ opacity: isContentEditable ? 0 : 1 }}
        >
          <MdOutlineKeyboardArrowRight
            className={"page-tree-open-close-icon"}
          />
        </div>
      </>
    );
  }, [app, handleToggle, isCollapsed, isContentEditable]);

  const afterContent = useMemo(() => {
    return (
      <>
        <div className="edit-file-name" onClick={handleEditName}>
          <HiOutlinePencil />
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
  }, [handleEditName, handleInsert]);

  const handleKeyPress = useCallback(
    (e) => {
      if (e.key === "Enter") {
        preventAndStop(e);
        app.cmd
          .Update(node.firstChild!, {
            [ContenteditablePath]: false,
          })
          .Update(node, {
            [LocalDirtyCounterPath]: new Date().getTime(),
          })
          .Select(PinnedSelection.SKIP)
          .Dispatch();
      }
    },
    [app, node],
  );

  return (
    <CarbonBlock
      node={node}
      custom={{
        ...activated.attributes,
      }}
    >
      <CarbonNodeContent
        node={node}
        beforeContent={beforeContent}
        afterContent={isContentEditable ? null : afterContent}
        custom={{ onKeyDown: handleKeyPress }}
        wrap={true}
      />

      {!isCollapsed && <CarbonNodeChildren node={node} />}
      {!isCollapsed && node.size === 1 && (
        <div className="carbon-collapsible__empty">No page inside</div>
      )}
    </CarbonBlock>
  );
};
