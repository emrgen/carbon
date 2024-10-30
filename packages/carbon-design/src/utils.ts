import { Affine } from "@emrgen/carbon-affine";
import {
  ActionOrigin,
  Node,
  StylePath,
  Transaction,
  TransformStatePath,
} from "@emrgen/carbon-core";
import { CSSProperties } from "react";

export const { abs, min, max } = Math;

export const getNodeStyle = (node: Node) => {
  return node.props.get<CSSProperties>(StylePath, {});
};

export const getNodeTransform = (node: Node) => {
  const css = node.props.get<string>(
    TransformStatePath,
    Affine.IDENTITY.toCSS(),
  );
  return Affine.fromCSS(css);
};

export const getNodePosition = (node: Node) => {
  const style = node.props.get<CSSProperties>(StylePath, {});
  return {
    left: parseInt(style.left?.toString() || "0"),
    top: parseInt(style.top?.toString() || "0"),
  };
};

// push one node update action into transaction
export const updatePosition = (
  cmd: Transaction,
  node: Node,
  left: number,
  top: number,
  origin: ActionOrigin = ActionOrigin.Unknown,
) => {
  cmd.Update(
    node,
    {
      [`${StylePath}/left`]: left + "px",
      [`${StylePath}/top`]: top + "px",
    },
    origin,
  );
};

export const bothTooSmall = ({ width, height }, w = 4, h = 4) => {
  return width <= w && height <= h;
};

export const tooSmall = ({ width, height }, w = 4, h = 4) => {
  return width <= w || height <= h;
};

export const tooSmallWidth = ({ width }, w = 4) => {
  return width <= w;
};

export const tooSmallHeight = ({ height }, h = 4) => {
  return height <= h;
};
