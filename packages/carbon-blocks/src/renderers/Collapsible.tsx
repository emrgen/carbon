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

export default function CollapsibleListComp(props: RendererProps) {
  const { node } = props;
  const { SelectionHalo } = useSelectionHalo(props);
  const app = useCarbon();
  const isCollapsed = node.isCollapsed;

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
    app.tr
      .updateData(node.id, { node: { collapsed: !isCollapsed } })
      .dispatch();
  }, [app.tr, node, isCollapsed]);

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
      {isCollapsed ? "▶" : "▼"}
    </div>
  );

  return (
    <CarbonBlock {...props}>
      <CarbonNodeContent node={node} beforeContent={beforeContent} />

      {!isCollapsed && (
        <>
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
        </>
      )}

      {SelectionHalo}
    </CarbonBlock>
  );
}
