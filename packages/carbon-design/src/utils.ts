import {
  ActionOrigin,
  Node,
  StylePath,
  Transaction,
} from "@emrgen/carbon-core";
import { CSSProperties } from "react";

export const { abs, min, max } = Math;

export const getNodeStyle = (node: Node) => {
  return node.props.get<CSSProperties>(StylePath, {});
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
