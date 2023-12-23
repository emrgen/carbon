import React, { useCallback, useRef } from "react";
import {
  ActionOrigin, Carbon,
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

  const blockSelection = useSelectionHalo(props);
  const dragDropRect = useDragDropRectSelect({ node, ref });
  const connectors = useConnectorsToProps(
    useCombineConnectors(dragDropRect, blockSelection)
  );

  // insert a new section as child of this collapsible
  const handleInsert = useCallback((app: Carbon) => {
    const section = app.schema.type("section").default()!;
    const at = Point.toAfter(node.child(0)!.id);

    app.cmd
      .Insert(at, section)
      .Select(
        PinnedSelection.fromPin(Pin.toStartOf(section)!),
        ActionOrigin.UserInput
      )
      .Dispatch();
  }, [node]);

  // toggle collapsed state
  const handleToggle = useCallback((app: Carbon) => {
    const {cmd, selection} = app;
    cmd
      .Update(node.id, {
        [CollapsedPath]: !isCollapsed,
      })
    if (!isCollapsed) {
      // const {start, end} = selection;
      // const startInTitle = start.node.closest(n => !!node.firstChild?.eq(n));
      // const endInTitle = end.node.closest(n => !!node.firstChild?.eq(n));
      cmd.Select(PinnedSelection.fromPin(Pin.toStartOf(node.child(0)!)!));
    }

    cmd.OneWay()
    cmd.Dispatch();
  }, [node, isCollapsed]);

  const beforeContent = (
    <div
      className="carbon-collapsible__control"
      contentEditable="false"
      suppressContentEditableWarning
      onMouseDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onClick={() => handleToggle(app)}
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
          onClick={() => handleInsert(app)}
        >
          Click to insert.
        </div>
      )}

      {SelectionHalo}
    </CarbonBlock>
  );
}
