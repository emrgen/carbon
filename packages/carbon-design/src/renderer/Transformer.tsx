import {
  getPoint,
  Line,
  Location,
  ResizeRatio,
  Shaper,
  toDeg,
  toRad,
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
import { cloneDeep, merge, round } from "lodash";
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
import { ShowCurrentAngleHint } from "../components/ShowCurrentAngleHint";
import { useBoard } from "../hook/useBoard";
import { useElement } from "../hook/useElement";
import { useBoardOverlay } from "../hook/useOverlay";
import { getNodeTransform } from "../utils";

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
  const elementRef = useRef<any>();
  const angleHintRef = useRef<any>();
  const styleRef = useRef<CSSProperties>();
  const board = useBoard();
  const [dragging, setDragging] = useState(false);
  const [transforming, setTransforming] = useState(false);
  const [selected, setSelected] = useState(false);
  const [active, setActive] = useState(false);
  const [withinSelectRect, setWithinSelectRect] = useState(false);
  const [distance, setDistance] = useState(5);
  const [nodeId] = useState(node.id.toString());

  const [shaper, setShaper] = useState<Shaper>(
    Shaper.from(getNodeTransform(node)),
  );
  const transformerStyle = useMemo(
    () => Shaper.from(getNodeTransform(node)).toStyle(),
    [node],
  );
  const [style, setStyle] = useState<CSSProperties>(() =>
    Shaper.from(getNodeTransform(node)).toStyle(),
  );

  const onDragStart = useCallback(
    (event: DndEvent) => {
      event.setInitState("x" + nodeId, {
        shaper: Shaper.from(getNodeTransform(node)),
      });
      setDragging(true);
      overlay.showOverlay();
    },
    [node, nodeId, overlay],
  );

  const onDragMove = useCallback(
    (event: DndEvent) => {
      const { shaper } = event.getInitState("x" + nodeId);
      const {
        position: { deltaX: dx, deltaY: dy },
      } = event;
      const newStyle = shaper.translate(dx, dy).toStyle();
      if (ref.current) {
        ref.current.style.left = newStyle.left;
        ref.current.style.top = newStyle.top;
        ref.current.style.transform = newStyle.transform;
      }

      if (elementRef.current) {
        elementRef.current.style.left = newStyle.left;
        elementRef.current.style.top = newStyle.top;
        elementRef.current.style.transform = newStyle.transform;
      }
    },
    [nodeId],
  );

  const onDragEnd = useCallback(
    (event: DndEvent) => {
      const { shaper } = event.getInitState("x" + nodeId);
      if (!Shaper.is(shaper)) return;

      const {
        position: { deltaX: dx, deltaY: dy },
      } = event;
      const transform = shaper.translate(dx, dy);
      setDragging(false);
      setShaper(transform);

      overlay.hideOverlay();
      // update the element style
      app.cmd
        .Update(node.id, {
          [TransformStatePath]: transform.toCSS(),
        })
        .Dispatch();
    },
    [app, node, nodeId, overlay],
  );

  // during dragging this hook will not re-evaluate as no dependencies changes
  const { listeners } = useMakeDraggable({
    node,
    handleRef: ref,
    distance,
    onDragStart: onDragStart,
    onDragMove: onDragMove,
    onDragEnd: onDragEnd,
    onMouseDown(e: DndEvent) {
      e.event.preventDefault();
      e.event.stopPropagation();
      if (!board.selectedNodes.has(node.id)) {
        board.selectNodes([node]);
      }
    },
    onMouseUp(e: DndEvent) {},
  });

  // subscribe to group drag events
  useEffect(() => {
    const onGroupDragStart = (nodeId: NodeId, event: DndEvent) => {
      // save the current transformation matrix
      event.setInitState(node.id.toString(), {
        shaper: Shaper.from(getNodeTransform(node)),
      });
    };

    const onGroupDragMove = (nodeId: NodeId, event: DndEvent) => {
      const { shaper } = event.getInitState(node.id.toString());
      const { deltaX: dx, deltaY: dy } = event.position;
      const after = shaper.translate(dx, dy);

      setStyle((style) => ({
        ...after.toStyle(),
      }));
      setShaper(after);
    };

    // no need to update the node style here as it will be updated by the group
    const onGroupDragEnd = (nodeId: NodeId, event: DndEvent) => {
      const { shaper } = event.getInitState(node.id.toString());
      const { deltaX: dx, deltaY: dy } = event.position;
      const after = shaper.translate(dx, dy);
      app.cmd
        .Update(node.id, {
          [TransformStatePath]: after.toCSS(),
        })
        .Dispatch();
    };

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
    event.setInitState(nodeId, {
      shaper: Shaper.from(getNodeTransform(node)),
      beforeLine: Line.fromPoint(getPoint(handle)).transform(shaper.affine()),
      angleLine: Line.fromPoint(getPoint(Location.BOTTOM)),
    });
  };
  const onTransformMove = (
    type: TransformType,
    anchor: TransformAnchor,
    handle: TransformHandle,
    event: DndEvent,
  ) => {
    if (type === TransformType.ROTATE) {
      const {
        beforeLine: before,
        shaper,
        angleLine,
      } = event.getInitState(nodeId);
      if (!Line.is(before)) return;
      if (!Line.is(angleLine)) return;
      const { deltaX: dx, deltaY: dy } = event.position;
      const after = before.moveEndBy(dx, dy);
      const angle = toRad(round(toDeg(after.angleBetween(before))));
      const style = shaper.rotate(angle).toStyle();
      if (ref.current) {
        ref.current.style.left = style.left;
        ref.current.style.top = style.top;
        ref.current.style.transform = style.transform;
      }
      if (elementRef.current) {
        elementRef.current.style.left = style.left;
        elementRef.current.style.top = style.top;
        elementRef.current.style.transform = style.transform;
      }

      if (angleHintRef.current) {
        // calculate the angle hint (some weird math)
        let hintAngle = round(toDeg(after.angle)) - 90;
        if (hintAngle < -180) {
          hintAngle = (360 + hintAngle) % 360;
        }

        angleHintRef.current.innerText = `${hintAngle}°`;
        angleHintRef.current.style.left = `${event.position.endX + 40}px`;
        angleHintRef.current.style.top = `${event.position.endY + 40}px`;
      }
    } else {
      const { shaper: before } = event.getInitState(nodeId);
      if (!Shaper.is(before)) return;
      const { deltaX: dx, deltaY: dy } = event.position;
      let after = before.resize(dx, dy, anchor, handle, ResizeRatio.FREE);

      const style = after.toStyle();
      if (ref.current) {
        ref.current.style.left = style.left;
        ref.current.style.top = style.top;
        ref.current.style.width = style.width;
        ref.current.style.height = style.height;
        ref.current.style.transform = style.transform;
      }

      if (elementRef.current) {
        elementRef.current.style.left = style.left;
        elementRef.current.style.top = style.top;
        elementRef.current.style.width = style.width;
        elementRef.current.style.height = style.height;
        elementRef.current.style.transform = style.transform;
      }
    }
  };

  const onTransformEnd = (
    type: TransformType,
    anchor: TransformAnchor,
    handle: TransformHandle,
    event: DndEvent,
  ) => {
    console.log("stop", type, event);
    if (type === TransformType.ROTATE) {
      const { beforeLine: startLine, shaper } = event.getInitState(nodeId);
      if (!Line.is(startLine)) return;
      const { deltaX: dx, deltaY: dy } = event.position;
      const currLine = startLine.moveEndBy(dx, dy);
      const angle = toRad(round(toDeg(currLine.angleBetween(startLine))));
      const after = shaper.rotate(angle);
      const style = after.toStyle();
      if (ref.current) {
        ref.current.style.left = style.left;
        ref.current.style.top = style.top;
        ref.current.style.transform = style.transform;
      }

      if (elementRef.current) {
        elementRef.current.style.left = style.left;
        elementRef.current.style.top = style.top;
        elementRef.current.style.transform = style.transform;
      }

      setShaper(after);
      overlay.hideOverlay();
      app.cmd
        .Update(node.id, {
          [TransformStatePath]: after.toCSS(),
        })
        .Dispatch();
    } else {
      const { shaper: before } = event.getInitState(nodeId);
      if (!Shaper.is(before)) return;
      const size = before.size();
      const { deltaX: dx, deltaY: dy } = event.position;
      const after = before.resize(dx, dy, anchor, handle, ResizeRatio.FREE);

      const style = after.toStyle();
      setShaper(after);
      overlay.hideOverlay();

      if (ref.current) {
        ref.current.style.left = style.left;
        ref.current.style.top = style.top;
        ref.current.style.transform = style.transform;
        ref.current.style.width = style.width;
        ref.current.style.height = style.height;
      }

      if (elementRef.current) {
        elementRef.current.style.left = style.left;
        elementRef.current.style.top = style.top;
        elementRef.current.style.width = style.width;
        elementRef.current.style.height = style.height;
        elementRef.current.style.transform = style.transform;
      }

      app.cmd
        .Update(node.id, {
          [TransformStatePath]: after.toCSS(),
        })
        .Dispatch();
    }

    setTransforming(false);
  };

  // merge the transformer style with the local style
  // when the transformer is dragged the local style will be updated
  // on drag end the transformer style will be updated using a transaction
  const styleProps = useMemo(() => {
    return merge(cloneDeep(transformerStyle), style);
  }, [transformerStyle, style]);

  return (
    <div className={"de-transformer-element"}>
      {/*<CarbonChildren node={node} />*/}
      <div
        className={"de-element-check"}
        ref={elementRef}
        style={shaper.toStyle()}
      ></div>
      <CarbonBlock
        ref={ref}
        node={node}
        custom={{ ...attrs, style: styleProps }}
        comp={(p, n) => {
          return defaultRenderPropComparator(p, n) && p.custom === n.custom;
        }}
      />

      {selected && !dragging && !transforming && (
        <CarbonTransformControls
          shaper={shaper}
          node={node}
          onTransformStart={onTransformStart}
          onTransformMove={onTransformMove}
          onTransformEnd={onTransformEnd}
        />
      )}

      <ShowCurrentAngleHint ref={angleHintRef} isRotating={transforming} />
    </div>
  );
};
