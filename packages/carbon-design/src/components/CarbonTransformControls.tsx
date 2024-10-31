import {
  Affine,
  Shaper,
  TransformAnchor,
  TransformHandle,
  TransformType,
} from "@emrgen/carbon-affine";
import { Node } from "@emrgen/carbon-core";
import { DndEvent } from "@emrgen/carbon-dragon";
import { MIN_SIZE_CORNER_SHOW, MIN_SIZE_SIDE_SHOW } from "../contants";
import { bothTooSmall, tooSmall, tooSmallHeight } from "../utils";
import { TransformerHandle } from "./TransformerHandle";

export type TransformHandler = (
  type: TransformType,
  anchor: TransformAnchor,
  handle: TransformHandle,
  event: DndEvent,
) => void;

interface CarbonTransformControlsProps {
  node: Node;
  shaper: Shaper;
  onTransformStart: TransformHandler;
  onTransformMove: TransformHandler;
  onTransformEnd: TransformHandler;
}

export const CarbonTransformControls = (
  props: CarbonTransformControlsProps,
) => {
  const size = props.shaper.size();

  return (
    <>
      <TransformerHandle
        {...props}
        hideHandle={tooSmall(size, 40, 10)}
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
        hideHandle={tooSmall(size, 10, 40)}
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
        hideHandle={tooSmall(size, 40, 10)}
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
        hideHandle={tooSmall(size, 10, 40)}
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

      <TransformerHandle
        {...props}
        className={"rotate-bottom-handle"}
        type={TransformType.ROTATE}
        anchor={TransformAnchor.CENTER}
        handle={TransformHandle.BOTTOM}
      />

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
