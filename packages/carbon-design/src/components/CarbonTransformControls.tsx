import {
  Affine,
  getPoint,
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

const handleTransformation = (affine: Affine, handle: TransformHandle) => {
  const point = affine.apply(getPoint(toLocation(handle)));
  if (handle === TransformHandle.BOTTOM) {
    console.log(point);
  }

  const sp = Shaper.from(Affine.translate(point.x, point.y)).rotate(
    affine.angle,
    // 200,
    // 200,
  );

  return {
    transform: sp.toCSS(),
  };
};

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
    return handleTransformation(affine, handle);
  }, [affine, handle]);

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