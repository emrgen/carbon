import { Node, StylePath } from "@emrgen/carbon-core";
import { DndEvent } from "@emrgen/carbon-dragon";
import { useTrackDrag } from "@emrgen/carbon-dragon-react";
import {
  CarbonBlock,
  CarbonChildren,
  defaultRenderPropComparator,
} from "@emrgen/carbon-react";
import { cloneDeep, merge } from "lodash";
import {
  CSSProperties,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useBoard } from "../hook/useBoard";
import { useBoardOverlay } from "../hook/useOverlay";

interface ElementTransformerProps {
  node: Node;
  children?: ReactNode;
}

export const TransformerComp = (props: ElementTransformerProps) => {
  const { children, node } = props;
  const { ref: overlayRef } = useBoardOverlay();
  const board = useBoard();
  const [selected, setSelected] = useState(false);
  const [active, setActive] = useState(false);
  const [withinSelectRect, setWithinSelectRect] = useState(false);
  const [{ ileft, itop }, setInitialPosition] = useState(() => {
    const style = node.props.get<CSSProperties>(StylePath, {}) ?? {};
    return {
      ileft: style.left ? parseInt(style.left.toString()) : 0,
      itop: style.top ? parseInt(style.top.toString()) : 0,
    };
  });
  const [style, setStyle] = useState<CSSProperties>(() =>
    node.props.get<CSSProperties>(StylePath, {}),
  );

  const transformerStyle = useMemo(() => {
    return node.props.get<CSSProperties>(StylePath, {});
  }, [node]);

  const { listeners } = useTrackDrag({
    node,
    ref: overlayRef,
    distance: 5,
    onDragEnd(event: DndEvent) {},
    onDragStart(event: DndEvent) {
      setInitialPosition({ ileft, itop });
    },
    onDragMove(event: DndEvent) {
      const { deltaX: dx, deltaY: dy } = event.position;
      setStyle({
        ...style,
        left: ileft + dx + "px",
        top: itop + dy + "px",
      });
      console.log("drag move", event);
    },
    onMouseDown(node: Node, event: MouseEvent) {},
    onMouseUp(node: Node, event: DndEvent) {},
  });

  const handleMouseDown = useCallback(
    (e: MouseEvent) => {
      e.stopPropagation();
      board.selectNodes([node]);
      listeners.onMouseDown(e);
    },
    [board, node, listeners],
  );

  useEffect(() => {
    board.onMountElement(node);
    return () => {
      board.onUnmountElement(node);
    };
  }, [board, node]);

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
    board.bus.on(node.id, "within:selecting:rect", onWithinSelectRect);
    board.bus.on(node.id, "outside:selecting:rect", onOutsideSelectRect);

    return () => {
      board.bus.off(node.id, "select", onSelect);
      board.bus.off(node.id, "deselect", onDeselect);
      board.bus.off(node.id, "activate", onActive);
      board.bus.off(node.id, "deactivate", onInactive);
      board.bus.off(node.id, "within:selecting:rect", onWithinSelectRect);
      board.bus.off(node.id, "outside:selecting:rect", onOutsideSelectRect);
    };
  }, [board, node.id]);

  const attrs = useMemo(() => {
    const classes = ["de-transformer"];
    if (selected) classes.push("de-element--selected");
    if (active) classes.push("de-element--active");
    if (withinSelectRect) classes.push("de-element--within-selecting-rect");

    return {
      className: classes.join(" "),
      onMouseDown: handleMouseDown,
    };
  }, [selected, active, withinSelectRect, handleMouseDown]);

  const styleProps = useMemo(() => {
    return merge(cloneDeep(transformerStyle), style);
  }, [transformerStyle, style]);

  console.log(attrs, styleProps);

  return (
    // @ts-ignore
    <CarbonBlock
      node={node}
      custom={{ ...attrs, style: styleProps }}
      comp={(p, n) => {
        return defaultRenderPropComparator(p, n) && p.custom === n.custom;
      }}
    >
      <CarbonChildren node={node} />
    </CarbonBlock>
  );
};