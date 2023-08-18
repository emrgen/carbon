import { Optional } from "@emrgen/types";
import { useCombineListeners } from "../hooks/useCombineListeners";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useDndMonitor } from "../hooks/useDndMonitor";
import { useDraggableHandle } from "../hooks/useDraggable";
import { useDragRect } from "../hooks/useDragRect";
import {
  ActionOrigin,
  Node,
  Pin,
  PinnedSelection,
  preventAndStop,
  useCarbon,
} from "@emrgen/carbon-core";
import { DndEvent } from "../types";
import { HiOutlinePlus } from "react-icons/hi";
import { PiDotsSixVerticalBold } from "react-icons/pi";

export interface FastDragHandleProps {
  node: Optional<Node>;
  style: any;
}

export const CarbonDragHandleId = "carbon-drag-handle";

export function DraggableHandle(props: FastDragHandleProps) {
  const { node, style } = props;
  const [show, setShow] = useState(false);

  const app = useCarbon();

  const ref = useRef(null);
  const { listeners } = useDraggableHandle({
    id: CarbonDragHandleId,
    node: node as Node,
    disabled: !node,
    ref,
    activationConstraint: {
      distance: 4,
    },
  });

  const { DragRectComp, onDragRectProgress, onDragRectStop } = useDragRect({
    overlay: true,
  });

  useEffect(() => {
    const onTransaction = (tr) => {
      setShow(false);
    };
    app.on("transaction", onTransaction);
    return () => {
      app.off("transaction", onTransaction);
    };
  }, [app]);

  useEffect(() => {
    const onMouseMove = (e) => {
      // if (e.target !== ref.current) {
      setShow(true);
      // }
    };

    window.addEventListener("mousemove", onMouseMove);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
    };
  }, []);

  const onDragStart = useCallback((e: DndEvent) => {
    if (e.id === CarbonDragHandleId) {
      // e.event.stopPropagation();
      // app.tr.selectNodes([])?.dispatch();
    }
  }, []);

  const onDragMove = useCallback(
    (e: DndEvent) => {
      if (e.id === CarbonDragHandleId) {
        onDragRectProgress(e);
      }
    },
    [onDragRectProgress]
  );

  const onDragEnd = useCallback(
    (e: DndEvent) => {
      if (e.id === CarbonDragHandleId) {
        onDragRectStop(e);
      }
    },
    [onDragRectStop]
  );

  const onMouseUp = useCallback(
    (node, e: DndEvent, isDragging) => {
      if (e.id !== CarbonDragHandleId) return;

      console.log("onMouseUp", node, event, isDragging);
      // app.focus();
      if (isDragging) {
        e.event.stopPropagation();
        e.event.preventDefault();
      } else {
        if (node) {
          app.parkCursor();
          app.tr
            .selectNodes(node.id)
            .then((app) => {
              return app.tr.select(
                PinnedSelection.fromPin(Pin.toStartOf(app.content)!)!,
                ActionOrigin.UserInput
              );
            })
            ?.dispatch();
        }
      }
    },
    [app]
  );

  useDndMonitor({
    onDragStart,
    onDragMove,
    onDragEnd,
    onMouseUp,
  });

  const handleAddNode = (e) => {
    preventAndStop(e);

    if (!node) return;

    if (node.isEmpty && !node.isAtom && !node.nextSibling?.isEmpty) {
      const title = node.find((n) => n.isTextBlock);
      if (node.isContainerBlock && title) {
        const after = PinnedSelection.fromPin(Pin.toStartOf(title)!);
        if (app.selection.eq(after)) return;
        app.tr
          .selectNodes([])
          .select(after, ActionOrigin.UserInput)
          ?.dispatch();
        return;
      }
    }

    if (
      node.nextSibling &&
      node.nextSibling?.isEmpty &&
      !node.nextSibling?.isAtom
    ) {
      const after = PinnedSelection.fromPin(Pin.toStartOf(node.nextSibling)!);
      if (app.selection.eq(after)) return;
      app.tr.selectNodes([]).select(after, ActionOrigin.UserInput)?.dispatch();
      return;
    }

    app.cmd.insert.after(node, "section")?.selectNodes([])
      ?.dispatch();
  };

  return (
    <div
      className="carbon-node-handle"
      data-target-name={node?.name}
      data-target-as={node?.attrs.html["data-as"]}
      data-drag-handle={node?.type.dragHandle}
      style={{ ...style, display: show ? "flex" : "none" }}
    >
      <div
        className="carbon-add-handle"
        onClick={handleAddNode}
        onMouseDown={preventAndStop}
      >
        <HiOutlinePlus />
      </div>
      <div
        className="carbon-drag-handle"
        ref={ref}
        {...listeners}
        onKeyDown={(e) => console.log(e)}
      >
        <PiDotsSixVerticalBold />
      </div>
      {createPortal(<>{DragRectComp}</>, document.body)}
    </div>
  );
}
