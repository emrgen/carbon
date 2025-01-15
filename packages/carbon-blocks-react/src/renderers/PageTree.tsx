import { BlockEvent, PageTreeItemName } from "@emrgen/carbon-blocks";
import {
  ActiveChildPath,
  AddPagePath,
  NodeId,
  OpenedPath,
  PinnedSelection,
  Point,
  preventAndStop,
  stop,
} from "@emrgen/carbon-core";
import {
  CarbonBlock,
  CarbonNodeChildren,
  CarbonNodeContent,
  RendererProps,
  useCarbon,
} from "@emrgen/carbon-react";
import { useCallback, useMemo } from "react";
import { HiOutlinePlus } from "react-icons/hi";
import { getPageTreeGroup } from "./PageTreeItem";

export const PageTreeComp = (props: RendererProps) => {
  const { node } = props;
  const app = useCarbon();

  const handleToggleCollapse = useCallback(() => {
    app.cmd.Select(PinnedSelection.SKIP).collapsible.toggle(node).Dispatch();
  }, [app, node]);

  // insert a new page at the end of the children
  const handleInsert = useCallback(
    (e) => {
      stop(e);
      const { cmd } = app;
      // if the node is collapsed, expand it
      if (node.isCollapsed) {
        cmd.collapsible.toggle(node);
      }

      // create a new page
      const item = app.schema.type(PageTreeItemName).default()!;
      item.firstChild?.updateContent([app.schema.text("Untitled")!]);
      item.updateProps({
        [OpenedPath]: true,
      });

      // insert the new page
      const at = Point.toAfter(node.lastChild!.id);
      cmd.Insert(at, item).Select(PinnedSelection.SKIP);

      const pageTreeGroup = getPageTreeGroup(node);
      if (pageTreeGroup) {
        // open the path
        cmd.Update(item, {
          [OpenedPath]: true,
        });

        const openedPath = pageTreeGroup.props.get(
          ActiveChildPath,
          NodeId.IDENTITY,
        );

        const openedNodeId = NodeId.fromObject(openedPath);
        console.log("closing", openedNodeId.toString());
        // close the previously opened path
        if (!openedNodeId.eq(NodeId.IDENTITY)) {
          cmd.Update(openedNodeId, {
            [OpenedPath]: false,
          });
        }

        // set the active child path
        cmd.Update(pageTreeGroup, {
          [ActiveChildPath]: item.id,
        });
      }

      cmd.Dispatch().Then(() => {
        app.emit(BlockEvent.openDocument, { node: item });
      });
    },
    [app, node],
  );

  const content = useMemo(() => {
    if (node.firstChild?.name === "plainText") {
      const addPage = node.firstChild.props.get(AddPagePath, false);
      return (
        <>
          <CarbonNodeContent
            node={node}
            key={node.key}
            wrapper={{ onClick: handleToggleCollapse, "data-test": 123 }}
            wrap={true}
            afterContent={
              <div
                className="add-child-file"
                onClick={handleInsert}
                onMouseDown={preventAndStop}
              >
                <HiOutlinePlus />
              </div>
            }
          />
          {!node.isCollapsed && <CarbonNodeChildren node={node} />}
        </>
      );
    } else {
      return <CarbonNodeChildren node={node} />;
    }
  }, [handleToggleCollapse, node]);

  const onMouseDown = useCallback((e) => {
    // preventAndStop(e);
  }, []);

  return (
    <CarbonBlock node={node} custom={{ onMouseDown }}>
      {content}
    </CarbonBlock>
  );
};
