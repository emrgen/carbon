import {
  Affine,
  getPoint,
  IPoint,
  Line,
  Shaper,
  toLocation,
  TransformAnchor,
  TransformHandle,
  TransformType,
} from "@emrgen/carbon-affine";
import { Node } from "@emrgen/carbon-core";
import { DndEvent } from "@emrgen/carbon-dragon";
import { Draggable } from "@emrgen/carbon-dragon-react";
import { useMemo } from "react";

export type TransformHandler = (
  type: TransformType,
  anchor: TransformAnchor,
  handle: TransformHandle,
  event: DndEvent,
) => void;

interface CarbonTransformControlsProps {
  node: Node;
  affine: Affine;
  onTransformStart: TransformHandler;
  onTransformMove: TransformHandler;
  onTransformEnd: TransformHandler;
}

export const CarbonTransformControls = (
  props: CarbonTransformControlsProps,
) => {
  const { node, affine, onTransformStart, onTransformMove, onTransformEnd } =
    props;

  return (
    <>
      <TransformerHandle
        {...props}
        className={"resize-bottom-handle"}
        type={TransformType.SCALE}
        anchor={TransformAnchor.TOP}
        handle={TransformHandle.BOTTOM}
      />

      <TransformerHandle
        {...props}
        className={"resize-top-right-handle"}
        type={TransformType.SCALE}
        anchor={TransformAnchor.TOP_RIGHT}
        handle={TransformHandle.BOTTOM_LEFT}
      />

      <TransformerHandle
        {...props}
        className={"resize-left-handle"}
        type={TransformType.SCALE}
        anchor={TransformAnchor.RIGHT}
        handle={TransformHandle.LEFT}
      />

      <TransformerHandle
        {...props}
        className={"resize-bottom-right-handle"}
        type={TransformType.SCALE}
        anchor={TransformAnchor.BOTTOM_RIGHT}
        handle={TransformHandle.TOP_LEFT}
      />

      <TransformerHandle
        {...props}
        className={"resize-top-handle"}
        type={TransformType.SCALE}
        anchor={TransformAnchor.BOTTOM}
        handle={TransformHandle.TOP}
      />

      <TransformerHandle
        {...props}
        className={"resize-bottom-left-handle"}
        type={TransformType.SCALE}
        anchor={TransformAnchor.BOTTOM_LEFT}
        handle={TransformHandle.TOP_RIGHT}
      />

      <TransformerHandle
        {...props}
        className={"resize-right-handle"}
        type={TransformType.SCALE}
        anchor={TransformAnchor.LEFT}
        handle={TransformHandle.RIGHT}
      />

      <TransformerHandle
        {...props}
        className={"resize-top-left-handle"}
        type={TransformType.SCALE}
        anchor={TransformAnchor.TOP_LEFT}
        handle={TransformHandle.BOTTOM_RIGHT}
      />

      <TransformerHandle
        {...props}
        className={"rotate-handle"}
        type={TransformType.ROTATE}
        anchor={TransformAnchor.CENTER}
        handle={TransformHandle.CENTER}
      />
    </>
  );
};

interface TransformerHandleProps {
  className: string;
  node: Node;
  affine: Affine;
  type: TransformType;
  anchor: TransformAnchor;
  handle: TransformHandle;
  onTransformStart: TransformHandler;
  onTransformMove: TransformHandler;
  onTransformEnd: TransformHandler;
}

const TransformerHandle = (props: TransformerHandleProps) => {
  const {
    className,
    node,
    affine,
    type,
    anchor,
    handle,
    onTransformStart,
    onTransformMove,
    onTransformEnd,
  } = props;

  // use affine to get the position of the handle

  const position = useMemo(() => {
    let point!: IPoint;
    if (type === TransformType.SCALE) {
      point = getPoint(toLocation(handle));
    } else {
      const offset = Line.fromPoint({ x: 36, y: 0 }).transform(
        affine.inverse(),
      ).length;
      point = { x: 0, y: 1 + offset };
    }

    return handleTransformation(affine, point);
  }, [affine, handle, type]);

  return (
    <Draggable
      node={node}
      style={position}
      className={className}
      onDragStart={(event) => {
        onTransformStart(type, anchor, handle, event);
      }}
      onDragMove={(event) => {
        onTransformMove(type, anchor, handle, event);
      }}
      onDragEnd={(event) => {
        onTransformEnd(type, anchor, handle, event);
      }}
    />
  );
};

const handleTransformation = (affine: Affine, handlePoint: IPoint) => {
  const point = affine.apply(handlePoint);

  const sp = Shaper.from(Affine.translate(point.x, point.y)).rotate(
    affine.angle,
  );
  const { x, y } = point;

  return {
    transform: `translate(${x}px, ${y}px) rotateZ(${affine.angle}rad)`,
  };
};