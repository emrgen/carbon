import { Node } from "@emrgen/carbon-core";
import { DndEvent } from "@emrgen/carbon-dragon";
import { useTrackDrag } from "@emrgen/carbon-dragon-react";
import {
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useBoard } from "../hook/useBoard";

interface ElementTransformerProps {
  node: Node;
  children?: ReactNode[];
}

export const ElementTransformer = (props: ElementTransformerProps) => {
  const { children, node } = props;
  const ref = useRef<HTMLDivElement>();
  const board = useBoard();
  const [selected, setSelected] = useState(false);
  const [active, setActive] = useState(false);
  const [withinSelectRect, setWithinSelectRect] = useState(false);

  const { listeners } = useTrackDrag({
    node,
    ref,
    distance: 5,
    onDragEnd(event: DndEvent) {},
    onDragStart(event: DndEvent) {},
    onDragMove(event: DndEvent) {
      console.log("drag move", event);
    },
    onMouseDown(node: Node, event: MouseEvent) {},
    onMouseUp(node: Node, event: DndEvent, isDragging: boolean) {},
  });

  const handleMouseDown = useCallback(
    (e: MouseEvent) => {
      e.stopPropagation();
      board.selectNodes([node]);
      listeners.onMouseDown(e);
    },
    [board, node, listeners],
  );

  // Subscribe to node events to update the selected state
  useEffect(() => {
    const onSelect = () => setSelected(true);
    const onDeselect = () => setSelected(false);
    const onActive = () => setActive(true);
    const onInactive = () => setActive(false);
    const onWithinSelectRect = () => setWithinSelectRect(true);
    const onOutsideSelectRect = () => setWithinSelectRect(false);

    board.bus.on(node.id, "select", onSelect);
    board.bus.on(node.id, "deselect", onDeselect);
    board.bus.on(node.id, "activate", onActive);
    board.bus.on(node.id, "deactivate", onInactive);
    board.bus.on(node.id, "within:select:rect", onWithinSelectRect);
    board.bus.on(node.id, "outside:select:rect", onOutsideSelectRect);

    return () => {
      board.bus.off(node.id, "select", onSelect);
      board.bus.off(node.id, "deselect", onDeselect);
      board.bus.off(node.id, "activate", onActive);
      board.bus.off(node.id, "deactivate", onInactive);
      board.bus.off(node.id, "within:select:rect", onWithinSelectRect);
      board.bus.off(node.id, "outside:select:rect", onOutsideSelectRect);
    };
  }, [board, node.id]);

  const attrs = useMemo(() => {
    const classes = ["carbon-transformer"];
    if (selected) classes.push("de-element--selected");
    if (active) classes.push("de-element--active");
    if (withinSelectRect) classes.push("de-element--within-select-rect");

    return {
      className: classes.join(" "),
      onMouseDown: handleMouseDown,
      onMouseUp: (e) => e.stopPropagation(),
    };
  }, [selected, active, withinSelectRect, handleMouseDown]);

  return (
    <div {...attrs} ref={ref}>
      {children}
    </div>
  );
};