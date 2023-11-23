import { Optional } from "@emrgen/types";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useDndMonitor } from "../hooks/useDndMonitor";
import { useDraggableHandle } from "../hooks/useDraggable";
import { useDragRect } from "../hooks/useDragRect";
import {
  ActionOrigin,
  Node,
  nodeLocation,
  Pin,
  PinnedSelection,
  Point,
  preventAndStop,
  useCarbon
} from "@emrgen/carbon-core";
import { DndEvent } from "../types";
import { HiOutlinePlus } from "react-icons/hi";
import { PiDotsSixVerticalBold } from "react-icons/pi";
import { useDndContext } from "../hooks";
import { elementBound } from "../core/utils";

export interface FastDragHandleProps {
  node: Optional<Node>;
  style: any;
}

export const CarbonDragHandleId = "carbon-drag-handle";

export function DraggableHandle(props: FastDragHandleProps) {
  const { node, style } = props;
  const [show, setShow] = useState(false);
  const [showDropHint, setShowDropHint] = useState(false);
  const [dropHintStyle, setDropHintStyle] = useState({} as any);

  const dnd = useDndContext();

  const app = useCarbon();

  const ref = useRef(null);
  const { listeners } = useDraggableHandle({
    id: CarbonDragHandleId,
    node: node as Node,
    disabled: !node,
    ref,
    activationConstraint: {
      distance: 4
    }
  });

  const { DragRectComp, onDragRectProgress, onDragRectStop } = useDragRect({
    overlay: true
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

  const findHitNode = useCallback(
    (e: DndEvent) => {
      const { clientX: x, clientY: y } = e.event;
      const bound = {
        minX: x,
        minY: y,
        maxX: x,
        maxY: y
      };

      const hits = dnd.droppables.collides(bound);
      return hits[0];
    },
    [dnd.droppables]
  );

  const findDropPosition = useCallback(
    (e: DndEvent, hitNode: Node) => {
      let to = Point.toAfter(hitNode);
      const hitElement = app.store.element(hitNode.firstChild!.id!);
      const { top, bottom } = elementBound(hitElement!);
      if (e.event.clientY < top + (bottom - top) / 2) {
        to = Point.toBefore(hitNode);
      }

      return to;
    },
    [app.store]
  );

  const onDragOverNode = useCallback(
    (e: DndEvent) => {
      const { node } = e;
      const hitNode = findHitNode(e);
      if (!hitNode) return;
      if (hitNode?.id.eq(node.id)) {
        // hide drop hint
        setShowDropHint(false);
        return;
      }

      if (hitNode.isDocument) return;
      console.log("hits", hitNode?.id.toString());
      // calculate drop hint position
      const to = findDropPosition(e, hitNode);
      const hitElement = app.store.element(to.nodeId);
      const { top, bottom, left, right, x, y } = elementBound(hitElement!);
      const width = right - left;
      const height = bottom - top;

      if (to.isBefore) {
        console.log(x, y);
        setDropHintStyle({
          top: top,
          left: left,
          width,
          height: 2,
        });
      } else {
        setDropHintStyle({
          top: bottom,
          left: left,
          width,
          height: 2,
        });
      }

      setShowDropHint(true);
    },
    [app.store, findDropPosition, findHitNode]
  );

  const onDropNode = useCallback(
    (e: DndEvent) => {
      const { node } = e;
      const hitNode = findHitNode(e);
      if (!hitNode) return;
      if (hitNode.isDocument) return;
      if (hitNode?.id.eq(node.id)) {
        // hide drop hint
        setShowDropHint(false);
        return;
      }

      console.log("dropped on", hitNode?.id.toString());
      // TODO: check if hitNode is a container and drop node is accepted at the drop position
      // check if hit node is within the drop node (this is not allowed)
      const isChildren = hitNode.chain.some((n) => n.eq(node));
      if (isChildren) {
        console.warn("cannot drop on children");
        return;
      }

      // setShowDropHint(false);
      const from = nodeLocation(node)!;
      const to = findDropPosition(e, hitNode);
      app.enable(() => {
        app.tr.move(from, to, node.id)?.dispatch();
      });
    },
    [app, findDropPosition, findHitNode]
  );

  const onDragMove = useCallback(
    (e: DndEvent) => {
      if (e.id === CarbonDragHandleId) {
        onDragRectProgress(e);
        onDragOverNode(e);
      }
    },
    [onDragOverNode, onDragRectProgress]
  );

  const onDragEnd = useCallback(
    (e: DndEvent) => {
      if (e.id === CarbonDragHandleId) {
        onDragRectStop(e);
        onDropNode(e);
      }
    },
    [onDragRectStop, onDropNode]
  );

  const onMouseUp = useCallback(
    (node: Node, e: DndEvent, isDragging: boolean) => {
      if (e.id !== CarbonDragHandleId) return;

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
    onMouseUp
  });

  const handleAddNode = (e) => {
    preventAndStop(e);

    if (!node) return;
    app.enable();
    app.focus();
    const { nextSibling: nextBlock } = node;

    if (node.isEmpty && !node.isAtom && !nextBlock?.isEmpty) {
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

    if (nextBlock && nextBlock?.isEmpty && !nextBlock?.isAtom) {
      const after = PinnedSelection.fromPin(Pin.toStartOf(nextBlock)!);
      if (app.selection.eq(after)) return;
      app.tr.selectNodes([]).select(after, ActionOrigin.UserInput)?.dispatch();
      return;
    }

    app.cmd.insert.after(node, "section")?.selectNodes([])?.dispatch();
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
      {createPortal(
        <>
          <div className="carbon-drop-hint"
               style={{ display: showDropHint ? "flex" : "none", ...dropHintStyle, position: "absolute" }} />
        </>,
        document.body
      )}
    </div>
  );
}
