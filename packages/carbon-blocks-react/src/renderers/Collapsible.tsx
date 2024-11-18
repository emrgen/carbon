import {
  ActionOrigin,
  Carbon,
  CollapsedPath,
  Pin,
  PinnedSelection,
  Point,
  TxType,
} from "@emrgen/carbon-core";
import { useDragDropRectSelectHalo } from "@emrgen/carbon-dragon-react";
import {
  CarbonBlock,
  CarbonNodeChildren,
  CarbonNodeContent,
  RendererProps,
  useCarbon,
} from "@emrgen/carbon-react";
import { useCallback, useRef } from "react";
import {
  MdKeyboardArrowRight,
  MdOutlineKeyboardArrowDown,
} from "react-icons/md";

export default function CollapsibleListComp(props: RendererProps) {
  const { node } = props;
  const app = useCarbon();
  const isCollapsed = node.isCollapsed;

  const ref = useRef(null);
  const { connectors, SelectionHalo } = useDragDropRectSelectHalo({
    node,
    ref,
  });

  // insert a new paragraph as child of this collapsible
  const handleInsert = useCallback(
    (app: Carbon) => {
      const paragraph = app.schema.type("paragraph").default()!;
      const at = Point.toAfter(node.child(0)!.id);

      app.cmd
        .Insert(at, paragraph)
        .Select(
          PinnedSelection.fromPin(Pin.toStartOf(paragraph)!),
          ActionOrigin.UserInput,
        )
        .Dispatch();
    },
    [node],
  );

  // toggle collapsed state
  const handleToggle = useCallback(
    (app: Carbon) => {
      const { cmd, selection } = app;
      cmd.Update(node.id, {
        [CollapsedPath]: !isCollapsed,
      });
      if (!isCollapsed) {
        const collapsible = app.store.get(node.id);
        if (!collapsible) return;
        // const {start, end} = selection;
        // const startInTitle = start.node.closest(n => !!node.firstChild?.eq(n));
        // const endInTitle = end.node.closest(n => !!node.firstChild?.eq(n));
        cmd.Select(
          PinnedSelection.fromPin(Pin.toStartOf(collapsible.child(0)!)!),
        );
      }

      cmd.WithType(TxType.OneWay);
      cmd.Dispatch();
    },
    [node, isCollapsed],
  );

  const beforeContent = (
    <div
      className="collapsible__control"
      contentEditable="false"
      suppressContentEditableWarning
      onMouseDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onClick={() => handleToggle(app)}
    >
      {isCollapsed ? <MdKeyboardArrowRight /> : <MdOutlineKeyboardArrowDown />}
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
        wrap={true}
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
