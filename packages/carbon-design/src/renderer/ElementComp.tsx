import { NodeId } from "@emrgen/carbon-core";
import { DndEvent } from "@emrgen/carbon-dragon";
import { CarbonNode, RendererProps } from "@emrgen/carbon-react";
import { useEffect } from "react";
import { useBoard } from "../hook/useBoard";

export const ElementComp = (props: RendererProps) => {
  const { node } = props;
  const board = useBoard();

  useEffect(() => {
    board.onMountElement(node);
    return () => {
      board.onUnmountElement(node);
    };
  }, [board, node]);

  // subscribe to transformation events for the node
  useEffect(() => {
    const onTransformStart = (nodeId: NodeId, event: DndEvent) => {};
    const onTransformMove = (nodeId: NodeId, event: DndEvent) => {};
    const onTransformEnd = (nodeId: NodeId, event: DndEvent) => {};

    board.bus.on(node.id, "transform:start", onTransformStart);
    board.bus.on(node.id, "transform:move", onTransformMove);
    board.bus.on(node.id, "transform:end", onTransformEnd);

    return () => {
      board.bus.off(node.id, "transform:start", onTransformStart);
      board.bus.off(node.id, "transform:move", onTransformMove);
      board.bus.off(node.id, "transform:end", onTransformEnd);
    };
  }, [board.bus, node.id]);

  // subscribe to group transformation events
  useEffect(() => {
    const onGroupTransformStart = (nodeId: NodeId, event: DndEvent) => {};
    const onGroupTransformMove = (nodeId: NodeId, event: DndEvent) => {};
    const onGroupTransformEnd = (nodeId: NodeId, event: DndEvent) => {};

    board.bus.on(node.id, "group:transform:start", onGroupTransformStart);
    board.bus.on(node.id, "group:transform:move", onGroupTransformMove);
    board.bus.on(node.id, "group:transform:end", onGroupTransformEnd);

    return () => {
      board.bus.off(node.id, "group:transform:start", onGroupTransformStart);
      board.bus.off(node.id, "group:transform:move", onGroupTransformMove);
      board.bus.off(node.id, "group:transform:end", onGroupTransformEnd);
    };
  }, [board.bus, node.id]);

  return <CarbonNode node={node} />;
};