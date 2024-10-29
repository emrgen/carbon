import { ActionOrigin, Node, NodeId, NodeIdMap } from "@emrgen/carbon-core";
import { DndEvent } from "@emrgen/carbon-dragon";
import { useMakeDraggable } from "@emrgen/carbon-dragon-react";
import { useCarbon } from "@emrgen/carbon-react";
import { clamp, identity } from "lodash";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useBoard } from "../hook/useBoard";
import { abs, getNodePosition, updatePosition } from "../utils";

interface SelectionGroupProps {}

export const SelectionGroup = (props: SelectionGroupProps) => {
  const board = useBoard();
  const app = useCarbon();
  const ref = useRef<any>();
  const [style, setStyle] = useState<CSSProperties>({});
  const [distance, setDistance] = useState(5);

  useEffect(() => {
    const onSelectEnd = () => {
      if (board.selectedNodes.size > 1) {
        const bounds = board.selectedNodesBound;
        setStyle({
          left: bounds.minX - 2,
          top: bounds.minY - 2,
          width: abs(bounds.maxX - bounds.minX + 4),
          height: abs(bounds.maxY - bounds.minY + 4),
        });
      } else {
        setStyle({ display: "none" });
      }
    };

    onSelectEnd();

    board.on("selectionchanged", onSelectEnd);
    return () => {
      board.off("selectionchanged", onSelectEnd);
    };
  }, [board]);

  const { listeners } = useMakeDraggable<{ left: number }>({
    node: Node.IDENTITY,
    ref,
    distance,
    onDragStart(event: DndEvent) {
      const store = new NodeIdMap<any>();
      const getData = (nodeId: NodeId) => store.get(nodeId);
      const setData = (nodeId: NodeId) => (data: any) => {
        store.set(nodeId, data);
      };

      const state = {
        style,
        store: new NodeIdMap(),
        getData,
      };

      event.setState(state);
      board.selectedNodes.forEach((nodeId) => {
        board.bus.emit(nodeId, "group:drag:start", {
          ...event,
          setState: setData(nodeId),
        });
      });
    },
    onDragMove(event: DndEvent) {
      const { state, position } = event;
      setStyle((s) => {
        return {
          ...s,
          left: state.style.left + position.deltaX,
          top: state.style.top + position.deltaY,
        };
      });

      // push the drag:move event to the selected nodes
      board.selectedNodes.forEach((nodeId) => {
        board.bus.emit(nodeId, "group:drag:move", {
          ...event,
          state: state.getData(nodeId),
        });
      });
    },
    onDragEnd(event: DndEvent) {
      setDistance((d) => {
        return clamp(d + Math.random(), 4, 5);
      });
      const { deltaX: dx, deltaY: dy } = event.position;

      const nodes = board.selectedNodes
        .map((nodeId) => {
          return app.store.get(nodeId);
        })
        .filter(identity) as Node[];

      // move the selected nodes by delta
      const { cmd } = app;
      nodes.forEach((node) => {
        const { left, top } = getNodePosition(node);
        updatePosition(cmd, node, left + dx, top + dy, ActionOrigin.UserInput);
      });
      cmd.Dispatch();

      board.selectedNodes.forEach((nodeId) => {
        board.bus.emit(nodeId, "group:drag:end", event);
      });
    },
    onMouseDown(node: Node, event: MouseEvent) {},
    onMouseUp(node: Node, event: DndEvent) {},
  });

  return (
    <div
      className="de-board--selection-group"
      style={style}
      ref={ref}
      {...listeners}
    ></div>
  );
};