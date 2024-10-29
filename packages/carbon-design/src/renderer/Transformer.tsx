import {
  Affine,
  ResizeRatio,
  Shaper,
  TransformAnchor,
  TransformHandle,
  TransformType,
} from "@emrgen/carbon-affine";
import { Node, NodeId, StylePath } from "@emrgen/carbon-core";
import { DndEvent } from "@emrgen/carbon-dragon";
import { useMakeDraggable } from "@emrgen/carbon-dragon-react";
import {
  CarbonBlock,
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
import { CarbonTransformControls } from "../components/CarbonTransformControls";
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
  const ref = useRef<HTMLDivElement>();
  const styleRef = useRef<CSSProperties>();
  const board = useBoard();
  const [selected, setSelected] = useState(false);
  const [active, setActive] = useState(false);
  const [withinSelectRect, setWithinSelectRect] = useState(false);
  const [distance, setDistance] = useState(5);

  const transformerStyle = useMemo(() => getNodeStyle(node), [node]);
  const [style, setStyle] = useState<CSSProperties>(() => getNodeStyle(node));
  const [affine, setAffine] = useState<Affine>(Affine.IDENTITY);

  useEffect(() => {
    setStyle(getNodeStyle(node));
  }, [node]);

  const onDragStart = useCallback(
    (event: DndEvent) => {
      console.log("drag start");
      const { left = 0, top = 0 } = node.props.get<CSSProperties>(
        StylePath,
        {},
      );
      event.setState({
        left: parseInt(left?.toString()) || 0,
        top: parseInt(top?.toString()) || 0,
      });

      // console.log();

      overlay.showOverlay();
    },
    [node, overlay],
  );

  const onDragMove = useCallback(
    (event: DndEvent) => {
      console.log("moving....");
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

      if (ref.current) {
        ref.current.style.left = newStyle.left;
        ref.current.style.top = newStyle.top;
      }

      // setStyle(newStyle);
      styleRef.current = newStyle;
    },
    [style],
  );

  const onDragEnd = useCallback(
    (event: DndEvent) => {
      console.log("drag end");
      overlay.hideOverlay();
      // update the element style
      app.cmd
        .Update(node.id, {
          [`${StylePath}/left`]: styleRef.current?.left,
          [`${StylePath}/top`]: styleRef.current?.top,
        })
        .Dispatch();
    },
    [app, node, overlay],
  );

  // during dragging this hook will not re-evaluate as no dependencies changes
  const { listeners } = useMakeDraggable<{ left: number; top: number }>({
    node,
    ref,
    distance,
    onDragStart: onDragStart,
    onDragMove: onDragMove,
    onDragEnd: onDragEnd,
    onMouseDown(node: Node, event: MouseEvent) {
      event.preventDefault();
      event.stopPropagation();
      if (!board.selectedNodes.has(node.id)) {
        board.selectNodes([node]);
      }
    },
    onMouseUp(node: Node, event: DndEvent) {},
  });

  // subscribe to group drag events
  useEffect(() => {
    const onGroupDragStart = (nodeId: NodeId, event: DndEvent) => {
      // save the current transformation matrix
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
    const onWithinSelectRect = () => {
      setWithinSelectRect(true);
    };
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
      ...listeners,
    };
  }, [selected, active, withinSelectRect, listeners]);

  // merge the transformer style with the local style
  // when the transformer is dragged the local style will be updated
  // on drag end the transformer style will be updated using a transaction
  const styleProps = useMemo(() => {
    return merge(cloneDeep(transformerStyle), style);
  }, [transformerStyle, style]);

  // console.log("styleProps", styleProps);

  const onTransformStart = (
    type: TransformType,
    anchor: TransformAnchor,
    handle: TransformHandle,
    event: DndEvent,
  ) => {};
  const onTransformMove = (
    type: TransformType,
    anchor: TransformAnchor,
    handle: TransformHandle,
    event: DndEvent,
  ) => {};
  const onTransformEnd = (
    type: TransformType,
    anchor: TransformAnchor,
    handle: TransformHandle,
    event: DndEvent,
  ) => {};

  return (
    <div className={"de-transformer-element"}>
      {/*<CarbonChildren node={node} />*/}
      <CarbonBlock
        ref={ref}
        node={node}
        custom={{ ...attrs, style: styleProps }}
        comp={(p, n) => {
          return defaultRenderPropComparator(p, n) && p.custom === n.custom;
        }}
      ></CarbonBlock>
      <CarbonTransformControls
        affine={Shaper.from(Affine.fromSize(100, 100))
          .translate(400, 400)
          .resize(
            25,
            25,
            TransformAnchor.CENTER,
            TransformHandle.BOTTOM_RIGHT,
            ResizeRatio.FREE,
          )
          .rotate(Math.PI / 4)
          .affine()}
        node={node}
        onTransformStart={onTransformStart}
        onTransformMove={onTransformMove}
        onTransformEnd={onTransformEnd}
      />
    </div>
  );
};