import { Node, NodeId, StylePath } from "@emrgen/carbon-core";
import { DndEvent } from "@emrgen/carbon-dragon";
import { useTrackDrag } from "@emrgen/carbon-dragon-react";
import {
  CarbonBlock,
  CarbonChildren,
  defaultRenderPropComparator,
  useCarbon,
} from "@emrgen/carbon-react";
import { cloneDeep, merge } from "lodash";
import {
  CSSProperties,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useBoard } from "../hook/useBoard";
import { useElement } from "../hook/useElement";
import { useBoardOverlay } from "../hook/useOverlay";
import { getNodeStyle } from "../utils";

interface ElementTransformerProps {
  node: Node;
  children?: ReactNode;
}

export const TransformerComp = (props: ElementTransformerProps) => {
  const { children, node } = props;
  useElement(props);
  const app = useCarbon();
  const overlay = useBoardOverlay();
  const ref = useRef();
  const styleRef = useRef<CSSProperties>();
  const board = useBoard();
  const [selected, setSelected] = useState(false);
  const [active, setActive] = useState(false);
  const [withinSelectRect, setWithinSelectRect] = useState(false);

  const transformerStyle = useMemo(() => getNodeStyle(node), [node]);
  const [style, setStyle] = useState<CSSProperties>(() => getNodeStyle(node));

  useEffect(() => {
    setStyle(getNodeStyle(node));
  }, [node]);

  // during dragging this hook will not re-evaluate as no dependencies changes
  const { listeners } = useTrackDrag<{ left: number; top: number }>({
    node,
    ref,
    distance: 5,
    onDragStart(event: DndEvent) {
      const { left = 0, top = 0 } = node.props.get<CSSProperties>(
        StylePath,
        {},
      );
      event.setState({
        left: parseInt(left?.toString()) || 0,
        top: parseInt(top?.toString()) || 0,
      });

      console.log();
      overlay.showOverlay();
    },
    onDragMove(event: DndEvent<{ left: number; top: number }>) {
      const {
        state,
        position: { deltaX: dx, deltaY: dy },
      } = event;
      const { left: x = 0, top: y = 0 } = state ?? {};
      const newStyle = {
        ...style,
        left: x + dx + "px",
        top: y + dy + "px",
      };

      setStyle(newStyle);
      styleRef.current = newStyle;
    },
    onDragEnd(event: DndEvent) {
      overlay.hideOverlay();
      // update the element style
      app.cmd
        .Update(node.id, {
          [`${StylePath}/left`]: styleRef.current?.left,
          [`${StylePath}/top`]: styleRef.current?.top,
        })
        .Dispatch();
    },
    onMouseDown(node: Node, event: MouseEvent) {},
    onMouseUp(node: Node, event: DndEvent) {},
  });

  const handleMouseDown = useCallback(
    (e: MouseEvent) => {
      e.stopPropagation();
      if (!board.selectedNodes.has(node.id)) {
        board.selectNodes([node]);
      }

      listeners.onMouseDown(e);
    },
    [board, node, listeners],
  );

  // subscribe to transformation events
  useEffect(() => {
    const onTransformStart = (nodeId: NodeId, event: DndEvent) => {};
    const onTransformMove = (nodeId: NodeId, event: DndEvent) => {};
    const onTransformEnd = (nodeId: NodeId, event: DndEvent) => {};

    board.bus.on(node.id, "transform:start", onTransformStart);
    board.bus.on(node.id, "transform:move", onTransformMove);
    board.bus.on(node.id, "transform:end", onTransformEnd);

    return () => {
      board.bus.off(node.id, "transform:start", onTransformStart);
      board.bus.off(node.id, "transform:move", onTransformMove);
      board.bus.off(node.id, "transform:end", onTransformEnd);
    };
  }, [board.bus, node.id]);

  // subscribe to group transformation events
  useEffect(() => {
    const onGroupTransformStart = (nodeId: NodeId, event: DndEvent) => {};
    const onGroupTransformMove = (nodeId: NodeId, event: DndEvent) => {};
    const onGroupTransformEnd = (nodeId: NodeId, event: DndEvent) => {};

    board.bus.on(node.id, "group:transform:start", onGroupTransformStart);
    board.bus.on(node.id, "group:transform:move", onGroupTransformMove);
    board.bus.on(node.id, "group:transform:end", onGroupTransformEnd);

    return () => {
      board.bus.off(node.id, "group:transform:start", onGroupTransformStart);
      board.bus.off(node.id, "group:transform:move", onGroupTransformMove);
      board.bus.off(node.id, "group:transform:end", onGroupTransformEnd);
    };
  }, [board.bus, node.id]);

  // subscribe to group drag events
  useEffect(() => {
    const onGroupDragStart = (nodeId: NodeId, event: DndEvent) => {
      event.setState({
        left: parseInt(transformerStyle.left?.toString() || "0"),
        top: parseInt(transformerStyle.top?.toString() || "0"),
      });
    };

    const onGroupDragMove = (nodeId: NodeId, event: DndEvent) => {
      const { left, top } = event.state;
      const { deltaX: dx, deltaY: dy } = event.position;
      setStyle((style) => ({
        ...style,
        left: left + dx + "px",
        top: top + dy + "px",
      }));
    };

    // no need to update the node style here as it will be updated by the group
    const onGroupDragEnd = (nodeId: NodeId, event: DndEvent) => {};

    board.bus.on(node.id, "group:drag:start", onGroupDragStart);
    board.bus.on(node.id, "group:drag:move", onGroupDragMove);
    board.bus.on(node.id, "group:drag:end", onGroupDragEnd);

    return () => {
      board.bus.off(node.id, "group:drag:start", onGroupDragStart);
      board.bus.off(node.id, "group:drag:move", onGroupDragMove);
      board.bus.off(node.id, "group:drag:end", onGroupDragEnd);
    };
  }, [board, node, transformerStyle]);

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

  // merge the transformer style with the local style
  // when the transformer is dragged the local style will be updated
  // on drag end the transformer style will be updated using a transaction
  const styleProps = useMemo(() => {
    return merge(cloneDeep(transformerStyle), style);
  }, [transformerStyle, style]);

  // console.log("styleProps", styleProps);

  return (
    // @ts-ignore
    <CarbonBlock
      ref={ref}
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