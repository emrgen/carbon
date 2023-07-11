import { useCallback, useMemo } from "react";
import {
  ActionOrigin,
  CarbonNodeChildren,
  Pin,
  PinnedSelection,
  Point,
  preventAndStop,
  useCarbon,
  useSelectionHalo,
} from "@emrgen/carbon-core";
import {
  CarbonBlock,
  CarbonChildren,
  CarbonNodeContent,
  RendererProps,
} from "@emrgen/carbon-core";

export const FileTreeItemComp = (props: RendererProps) => {
  const { node, placeholder } = props;
  //  const ref = useRef(null);
  const { attributes, isActive } = useSelectionHalo(props);
  const app = useCarbon();
  const isCollapsed = node.isCollapsed;

  // const { listeners } = useDragDropRectSelect({ node, ref });
  // console.log(node.textContent);
  // console.log(attributes);
  // console.log(node.attrs.node.emptyPlaceholder, node.name);

  const handleToggle = useCallback(() => {
    app.tr
      .updateData(node.id, { node: { collapsed: !isCollapsed } })
      .dispatch();
  }, [app.tr, node, isCollapsed]);

  // insert a new section as child of this collapsible
  const handleInsert = useCallback((e) => {
    preventAndStop(e);
    const item = app.schema.type("fileTreeItem").default()!;
    const at = Point.toAfter(node.child(0)!.id);

    app.tr
      .insert(at, item)
      .updateData(node.id, { node: { collapsed: false } })
      .activateNodes(item.id)
      .selectNodes(item.id)
      .dispatch();
  }, [app.schema, app.tr, node]);

  const beforeContent = useMemo(() => {
    return (
      <>
        <div
          className="carbon-collapsible__control"
          contentEditable="false"
          suppressContentEditableWarning
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onClick={handleToggle}
        >
          {isCollapsed ? "▶" : "▼"}
        </div>
        <div className="add-child-file" onClick={handleInsert} onMouseDown={preventAndStop}>
          +
        </div>
      </>
    );
  }, [handleInsert, handleToggle, isCollapsed]);

  console.log("XXX",node.id.toString(), isActive, node.data.state, node.data.state.selected);

  return (
    <CarbonBlock node={node} custom={attributes}>
      <CarbonNodeContent node={node} beforeContent={beforeContent} custom={{contentEditable: isActive}}/>
      {!isCollapsed && <CarbonNodeChildren node={node} />}
      {!isCollapsed && node.size === 1 && (
        <div className="carbon-collapsible__empty">No page inside</div>
      )}
    </CarbonBlock>
  );
};
