import {ViewedPath} from "@emrgen/carbon-blocks";
import {
  ActionOrigin,
  CarbonEditor,
  CollapsedPathLocal,
  isContentEditable,
  Pin,
  PinnedSelection,
  Point,
  TxType,
} from "@emrgen/carbon-core";
import {useDragDropRectSelectHalo} from "@emrgen/carbon-dragon-react";
import {CarbonBlock, CarbonChildren, RendererProps, useCarbon,} from "@emrgen/carbon-react";
import {Optional} from "@emrgen/types";
import React, {useCallback, useRef} from "react";
import {FaLightbulb, FaRegCheckCircle, FaRegLightbulb} from "react-icons/fa";
import {useDocument} from "../hooks";

const isParentContentEditable = (el: HTMLElement) => {
  let node: Optional<HTMLElement> = el;
  while (node) {
    console.log(el, el.getAttribute("contentEditable"));
    if (el.getAttribute("contentEditable") === "true") return true;
    node = node.parentNode as HTMLElement;
  }

  return false;
};

export default function HintComp(props: RendererProps) {
  const { node } = props;
  const app = useCarbon();

  const { doc } = useDocument();

  const ref = useRef(null);
  const { connectors, SelectionHalo } = useDragDropRectSelectHalo({
    node,
    ref,
  });

  const isCollapsed = node.props.get<boolean>(CollapsedPathLocal, false);

  // insert a new paragraph as child of this collapsible
  const handleInsert = useCallback(
    (app: CarbonEditor) => {
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
  const handleToggle = useCallback(() => {
    const { cmd, selection } = app;
    cmd.Update(node.id, {
      [CollapsedPathLocal]: !isCollapsed,
      [ViewedPath]: true,
    });

    // if currently not collapsed, next state will be collapsed
    // so select the first child otherwise the current selection may not be valid
    if (!isCollapsed) {
      cmd.Select(PinnedSelection.fromPin(Pin.toStartOf(node.child(0)!)!));
    } else {
      cmd.Select(selection);
    }

    cmd.WithType(TxType.OneWay);
    cmd.Dispatch();
  }, [app, node, isCollapsed]);

  // prevent click if content is editable
  const handleContentClick = useCallback(
    (e: React.MouseEvent) => {
      if (!isContentEditable(doc)) {
        handleToggle();
      }
    },
    [doc, handleToggle],
  );

  const beforeContent = (
    <div
      className="carbon-hint__control"
      contentEditable="false"
      suppressContentEditableWarning
      onMouseDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onClick={() => handleToggle()}
    >
      {isCollapsed ? <FaRegLightbulb /> : <FaLightbulb />}
    </div>
  );

  const isViewed = node.props.get<boolean>(ViewedPath, false);

  const afterContent = (
    <div
      className="carbon-hint__viewed"
      contentEditable="false"
      suppressContentEditableWarning
      data-viewed={isViewed}
    >
      {isViewed && <FaRegCheckCircle />}
    </div>
  );

  return (
    <CarbonBlock
      {...props}
      custom={{ "data-collapsed": isCollapsed, ...connectors }}
      ref={ref}
    >
      <CarbonChildren node={node} />
      {SelectionHalo}
    </CarbonBlock>
  );
}
