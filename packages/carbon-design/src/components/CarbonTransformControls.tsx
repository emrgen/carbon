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
import { CSSProperties, useMemo } from "react";
import { MIN_SIZE_CORNER_SHOW, MIN_SIZE_SIDE_SHOW } from "../contants";
import { useBoardOverlay } from "../hook/useOverlay";
import { bothTooSmall, tooSmall, tooSmallHeight } from "../utils";

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
  const size = Shaper.from(props.affine).size();

  return (
    <>
      <TransformerHandle
        {...props}
        hideHandle={tooSmall(size, MIN_SIZE_SIDE_SHOW, MIN_SIZE_SIDE_SHOW)}
        hideAll={tooSmallHeight(size, MIN_SIZE_CORNER_SHOW)}
        className={"resize-bottom-handle"}
        type={TransformType.SCALE}
        anchor={TransformAnchor.TOP}
        handle={TransformHandle.BOTTOM}
      />

      <TransformerHandle
        {...props}
        hideHandle={tooSmall(size)}
        hideAll={tooSmall(size, 10, 10)}
        className={"resize-top-right-handle"}
        type={TransformType.SCALE}
        anchor={TransformAnchor.BOTTOM_LEFT}
        handle={TransformHandle.TOP_RIGHT}
      />

      <TransformerHandle
        {...props}
        hideHandle={tooSmall(size, 30, 30)}
        className={"resize-left-handle"}
        type={TransformType.SCALE}
        anchor={TransformAnchor.RIGHT}
        handle={TransformHandle.LEFT}
      />

      <TransformerHandle
        {...props}
        className={"resize-bottom-right-handle"}
        type={TransformType.SCALE}
        anchor={TransformAnchor.TOP_LEFT}
        handle={TransformHandle.BOTTOM_RIGHT}
      />

      <TransformerHandle
        {...props}
        hideHandle={tooSmall(size, 30, 30)}
        className={"resize-top-handle"}
        type={TransformType.SCALE}
        anchor={TransformAnchor.BOTTOM}
        handle={TransformHandle.TOP}
      />

      <TransformerHandle
        {...props}
        className={"resize-bottom-left-handle"}
        hideAll={tooSmall(size, 10, 10)}
        type={TransformType.SCALE}
        anchor={TransformAnchor.TOP_RIGHT}
        handle={TransformHandle.BOTTOM_LEFT}
      />

      <TransformerHandle
        {...props}
        hideHandle={tooSmall(size, 30, 30)}
        className={"resize-right-handle"}
        type={TransformType.SCALE}
        anchor={TransformAnchor.LEFT}
        handle={TransformHandle.RIGHT}
      />

      <TransformerHandle
        {...props}
        hideHandle={tooSmall(size)}
        hideAll={bothTooSmall(size)}
        className={"resize-top-left-handle"}
        type={TransformType.SCALE}
        anchor={TransformAnchor.BOTTOM_RIGHT}
        handle={TransformHandle.TOP_LEFT}
      />

      {/*<TransformerHandle*/}
      {/*  {...props}*/}
      {/*  className={"rotate-bottom-handle"}*/}
      {/*  type={TransformType.ROTATE}*/}
      {/*  anchor={TransformAnchor.CENTER}*/}
      {/*  handle={TransformHandle.BOTTOM}*/}
      {/*/>*/}

      {/*<TransformerHandle*/}
      {/*  {...props}*/}
      {/*  className={"rotate-bottom-right-handle"}*/}
      {/*  type={TransformType.ROTATE}*/}
      {/*  anchor={TransformAnchor.CENTER}*/}
      {/*  handle={TransformHandle.BOTTOM_RIGHT}*/}
      {/*/>*/}
    </>
  );
};

interface TransformerHandleProps {
  className: string;
  hideHandle?: boolean;
  hideAll?: boolean;
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
    hideHandle,
    hideAll,
    node,
    affine,
    type,
    anchor,
    handle,
    onTransformStart,
    onTransformMove,
    onTransformEnd,
  } = props;

  const overlay = useBoardOverlay();

  // use affine to get the position of the handle
  const position = useMemo(() => {
    let point!: IPoint;
    if (type === TransformType.SCALE) {
      point = getPoint(toLocation(handle));
    } else {
      const offset = Line.fromPoint(getPoint(handle)).transform(
        affine.inverse(),
      ).length;
      point = { x: 0, y: 1 + offset };
    }

    return handleTransformation(affine, type, handle, point);
  }, [affine, handle, type]);

  if (hideAll) return null;

  return (
    <Draggable
      node={node}
      refCheck={(ref, target) => {
        let current = target;
        while (current) {
          if (current === ref) return true;
          current = current?.parentElement;
        }
        return false;
      }}
      style={position}
      className={className}
      onDragStart={(event) => {
        overlay.showOverlay();
        onTransformStart(type, anchor, handle, event);
      }}
      onDragMove={(event) => {
        onTransformMove(type, anchor, handle, event);
      }}
      onDragEnd={(event) => {
        onTransformEnd(type, anchor, handle, event);
        overlay.hideOverlay();
      }}
    >
      <div
        className="transform-handle"
        style={{
          display: hideHandle ? "none" : "block",
        }}
      />
    </Draggable>
  );
};

const isAlongX = (handle: TransformHandle) => {
  return handle === TransformHandle.LEFT || handle === TransformHandle.RIGHT;
};

const isAlongY = (handle: TransformHandle) => {
  return handle === TransformHandle.TOP || handle === TransformHandle.BOTTOM;
};

const handleTransformation = (
  affine: Affine,
  type: TransformType,
  handle: TransformHandle,
  handlePoint: IPoint,
) => {
  const point = affine.apply(handlePoint);
  const { x, y } = point;

  const sp = Shaper.from(Affine.translate(point.x, point.y)).rotate(
    affine.angle,
  );

  const style: CSSProperties = {
    transform: `translate(${x}px, ${y}px) rotateZ(${affine.angle}rad)`,
  };

  const height = isAlongX(handle)
    ? Shaper.from(affine).size().height + "px"
    : "";
  const width = isAlongY(handle) ? Shaper.from(affine).size().width + "px" : "";

  if (height && type === TransformType.SCALE) {
    style.height = height;
    style.top = `-${parseInt(height) / 2}px`;
  }

  if (width && type === TransformType.SCALE) {
    style.width = width;
    style.left = `-${parseInt(width) / 2}px`;
  }

  return style;
};