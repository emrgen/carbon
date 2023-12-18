import React, { useCallback, useRef } from "react";
import {
  ActionOrigin,
  CarbonBlock,
  CarbonNodeChildren,
  CarbonNodeContent, CollapsedPath,
  Pin,
  PinnedSelection,
  Point,
  RendererProps,
  useCarbon,
  useSelectionHalo
} from "@emrgen/carbon-core";
import {
  MdOutlineKeyboardArrowDown,
  MdOutlineKeyboardArrowRight,
} from "react-icons/md";
import { useCombineConnectors, useConnectorsToProps, useDragDropRectSelect } from "@emrgen/carbon-dragon";

export default function CollapsibleListComp(props: RendererProps) {
  const { node } = props;
  const { SelectionHalo } = useSelectionHalo(props);
  const app = useCarbon();
  const isCollapsed = node.isCollapsed;

  const ref = useRef(null);

  const selection = useSelectionHalo(props);
  const dragDropRect = useDragDropRectSelect({ node, ref });
  const connectors = useConnectorsToProps(
    useCombineConnectors(dragDropRect, selection)
  );

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
      .updateProps(node.id, {
        [CollapsedPath]: !isCollapsed,
      })
    if (!isCollapsed) {
      tr.select(PinnedSelection.fromPin(Pin.toStartOf(node.child(0)!)!));
    }
    tr.oneWay()
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
    <CarbonBlock
      {...props}
      custom={{ "data-collapsed": isCollapsed, ...connectors }}
      ref={ref}
    >
      <CarbonNodeContent
        node={node}
        beforeContent={beforeContent}
      />

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
