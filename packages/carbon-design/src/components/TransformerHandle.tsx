import {
  Affine,
  getPoint,
  IPoint,
  Line,
  Shaper,
  toDeg,
  toLocation,
  TransformAnchor,
  TransformHandle,
  TransformType,
  Vector,
} from "@emrgen/carbon-affine";
import { Node } from "@emrgen/carbon-core";
import { Draggable } from "@emrgen/carbon-dragon-react";
import { CSSProperties, useMemo } from "react";
import { useBoardOverlay } from "../hook/useOverlay";
import { TransformHandler } from "./CarbonTransformControls";

interface TransformerHandleProps {
  className: string;
  hideHandle?: boolean;
  hideAll?: boolean;
  node: Node;
  shaper: Shaper;
  type: TransformType;
  anchor: TransformAnchor;
  handle: TransformHandle;
  onTransformStart: TransformHandler;
  onTransformMove: TransformHandler;
  onTransformEnd: TransformHandler;
}

export const TransformerHandle = (props: TransformerHandleProps) => {
  const {
    className,
    hideHandle,
    hideAll,
    node,
    shaper,
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
        shaper.affine().inverse(),
      ).length;
      point = { x: 0, y: 1 + 50 / shaper.size().height };
    }

    return handleTransformation(shaper, type, handle, point);
  }, [shaper, handle, type]);

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
  shaper: Shaper,
  type: TransformType,
  handle: TransformHandle,
  handlePoint: IPoint,
) => {
  const point = shaper.apply(handlePoint);
  const { x, y } = point;

  const sp = Shaper.from(Affine.translate(point.x, point.y)).rotate(
    shaper.angle,
  );

  const before = Line.fromPoint(handlePoint);
  const after = before.transform(shaper.affine());
  const angle = -before.angleBetween(after);

  const style: CSSProperties = {
    transform: `translate(${x}px, ${y}px) rotateZ(${angle}rad)`,
  };

  const height = isAlongX(handle) ? shaper.size().height + "px" : "";
  const width = isAlongY(handle) ? shaper.size().width + "px" : "";

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
