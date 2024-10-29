import {
  Affine,
  ResizeRatio,
  Shaper,
  TransformAnchor,
  TransformHandle,
  TransformType,
} from "@emrgen/carbon-affine";
import { Node, NodeId, TransformStatePath } from "@emrgen/carbon-core";
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
import { getNodeTransform, max } from "../utils";

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
  const [dragging, setDragging] = useState(false);
  const [transforming, setTransforming] = useState(false);
  const [selected, setSelected] = useState(false);
  const [active, setActive] = useState(false);
  const [withinSelectRect, setWithinSelectRect] = useState(false);
  const [distance, setDistance] = useState(5);

  const [affine, setAffine] = useState<Affine>(getNodeTransform(node));
  const transformerStyle = useMemo(
    () => Shaper.from(getNodeTransform(node)).toStyle(),
    [node],
  );
  const [style, setStyle] = useState<CSSProperties>(() =>
    Shaper.from(getNodeTransform(node)).toStyle(),
  );

  const onDragStart = useCallback(
    (event: DndEvent) => {
      event.setState({
        shaper: Shaper.from(getNodeTransform(node)),
      });
      setDragging(true);
      overlay.showOverlay();
    },
    [node, overlay],
  );

  const onDragMove = useCallback((event: DndEvent) => {
    const { shaper } = event.state;
    const {
      position: { deltaX: dx, deltaY: dy },
    } = event;
    const newStyle = shaper.translate(dx, dy).toStyle();
    if (ref.current) {
      ref.current.style.left = newStyle.left;
      ref.current.style.top = newStyle.top;
      ref.current.style.transform = newStyle.transform;
    }
  }, []);

  const onDragEnd = useCallback(
    (event: DndEvent) => {
      const { shaper } = event.state;
      if (!Shaper.is(shaper)) return;

      const {
        position: { deltaX: dx, deltaY: dy },
      } = event;
      const transform = shaper.translate(dx, dy);
      setDragging(false);
      setAffine(transform.affine());

      overlay.hideOverlay();
      // update the element style
      app.cmd
        .Update(node.id, {
          [TransformStatePath]: transform.toCSS(),
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
        shaper: Shaper.from(getNodeTransform(node)),
      });
    };

    const onGroupDragMove = (nodeId: NodeId, event: DndEvent) => {
      const { shaper } = event.state;
      const { deltaX: dx, deltaY: dy } = event.position;
      setStyle((style) => ({
        ...shaper.translate(dx, dy).toStyle(),
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

  // console.log("styleProps", styleProps);

  const onTransformStart = (
    type: TransformType,
    anchor: TransformAnchor,
    handle: TransformHandle,
    event: DndEvent,
  ) => {
    console.log(type, event);
    setTransforming(true);
    event.setState({
      shaper: Shaper.from(getNodeTransform(node)),
    });
  };
  const onTransformMove = (
    type: TransformType,
    anchor: TransformAnchor,
    handle: TransformHandle,
    event: DndEvent,
  ) => {
    console.log(type, anchor, handle, event);
    if (type === TransformType.ROTATE) {
    } else {
      const { shaper: before } = event.state;
      if (!Shaper.is(before)) return;
      const { deltaX: dx, deltaY: dy } = event.position;
      let after = before.resize(dx, dy, anchor, handle, ResizeRatio.FREE);
      const { width, height } = after.size();

      const w = max(4, width);
      const h = max(4, height);
      if (w <= 4 || h <= 4) {
        after = before.resizeTo(w, h, anchor, handle);
      }

      const style = after.toStyle();
      if (ref.current) {
        ref.current.style.left = style.left;
        ref.current.style.top = style.top;
        ref.current.style.transform = style.transform;
        ref.current.style.width = style.width;
        ref.current.style.height = style.height;
      }

      console.log("moving", after.size());
    }
  };
  const onTransformEnd = (
    type: TransformType,
    anchor: TransformAnchor,
    handle: TransformHandle,
    event: DndEvent,
  ) => {
    console.log(type, event);
    setTransforming(false);
    if (type === TransformType.ROTATE) {
    } else {
      const { shaper: before } = event.state;
      if (!Shaper.is(before)) return;
      const size = before.size();
      const { deltaX: dx, deltaY: dy } = event.position;
      let after = before.resize(dx, dy, anchor, handle, ResizeRatio.FREE);
      const { width, height } = after.size();

      const w = max(4, width);
      const h = max(4, height);
      if (w <= 4 || h <= 4) {
        after = before.resizeTo(w, h, anchor, handle);
      }

      setAffine(after.affine());
      overlay.hideOverlay();

      const style = after.toStyle();
      if (ref.current) {
        ref.current.style.left = style.left;
        ref.current.style.top = style.top;
        ref.current.style.transform = style.transform;
        ref.current.style.width = style.width;
        ref.current.style.height = style.height;
      }

      // update the element style
      app.cmd
        .Update(node.id, {
          [TransformStatePath]: after.toCSS(),
        })
        .Dispatch();
    }
  };

  // merge the transformer style with the local style
  // when the transformer is dragged the local style will be updated
  // on drag end the transformer style will be updated using a transaction
  const styleProps = useMemo(() => {
    return merge(cloneDeep(transformerStyle), style);
  }, [transformerStyle, style]);

  console.log(styleProps);

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
      {selected && !dragging && !transforming && (
        <CarbonTransformControls
          affine={affine}
          node={node}
          onTransformStart={onTransformStart}
          onTransformMove={onTransformMove}
          onTransformEnd={onTransformEnd}
        />
      )}
    </div>
  );
};