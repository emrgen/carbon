import React, { useCallback } from "react";
import {
  ActionOrigin,
  CarbonBlock,
  CarbonNodeChildren,
  CarbonNodeContent,
  Pin,
  PinnedSelection,
  Point,
  RendererProps,
  useCarbon,
  useSelectionHalo,
} from "@emrgen/carbon-core";
import {
  MdOutlineKeyboardArrowDown,
  MdOutlineKeyboardArrowRight,
} from "react-icons/md";
import { usePlaceholder } from "../hooks";

export default function CollapsibleListComp(props: RendererProps) {
  const { node } = props;
  const { SelectionHalo } = useSelectionHalo(props);
  const app = useCarbon();
  const isCollapsed = node.isCollapsed;
  const placeholder = usePlaceholder(node);

  // insert a new section as child of this collapsible
  const handleInsert = useCallback(() => {
    const section = app.schema.type("section").default()!;
    const at = Point.toAfter(node.child(0)!.id);

    app.tr
      .insert(at, section)
      .select(
        PinnedSelection.fromPin(Pin.toStartOf(section)!),
        ActionOrigin.UserInput
      )
      .dispatch();
  }, [app.schema, app.tr, node]);

  // toggle collapsed state
  const handleToggle = useCallback(() => {
    const {tr} = app;
    tr
      .updateAttrs(node.id, { node: { collapsed: !isCollapsed } })
    if (!isCollapsed) {
      tr.select(PinnedSelection.fromPin(Pin.toStartOf(node.child(0)!)!));
    }
    tr.dispatch();
  }, [app, node, isCollapsed]);

  const beforeContent = (
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
      {isCollapsed ? (
        <MdOutlineKeyboardArrowRight />
      ) : (
        <MdOutlineKeyboardArrowDown />
      )}
    </div>
  );

  return (
    <CarbonBlock {...props} custom={{ "data-collapsed": isCollapsed }}>
      <CarbonNodeContent node={node} beforeContent={beforeContent} custom={placeholder}/>

      {node.size > 1 ? (
        <CarbonNodeChildren node={node} />
      ) : (
        <div
          className="collapsible-empty-content"
          contentEditable="false"
          suppressContentEditableWarning
          onClick={handleInsert}
        >
          Click to insert.
        </div>
      )}

      {SelectionHalo}
    </CarbonBlock>
  );
}
