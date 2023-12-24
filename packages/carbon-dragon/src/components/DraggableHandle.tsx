import { Optional } from "@emrgen/types";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useDndMonitor } from "../hooks/useDndMonitor";
import { useDraggableHandle } from "../hooks/useDraggable";
import { useDragRect } from "../hooks/useDragRect";
import {
  ActionOrigin,
  EventsIn, EventsOut,
  Node,
  nodeLocation,
  Pin,
  PinnedSelection,
  Point,
  preventAndStop,
  useCarbon,
  useNodeState
} from "@emrgen/carbon-core";
import { DndEvent } from "../types";
import { HiOutlinePlus } from "react-icons/hi";
import { PiDotsSixVerticalBold } from "react-icons/pi";
import { useDndContext } from "../hooks";
import { elementBound } from "../core/utils";
import { isNestableNode } from "@emrgen/carbon-blocks";
import { CustomEvent } from "@emrgen/carbon-core/src/core/CustomEvent";

export interface FastDragHandleProps {
  node: Node;
  style: any;
}

export const CarbonDragHandleId = "carbon-drag-handle";

export function DraggableHandle(props: FastDragHandleProps) {
  const { node, style } = props;
  const [show, setShow] = useState(false);
  const [showDropHint, setShowDropHint] = useState(false);
  const [dropHintStyle, setDropHintStyle] = useState({} as any);
  const {attributes} = useNodeState({node});
  const dnd = useDndContext();

  const app = useCarbon();

  const handleRef = useRef(null);

  const { listeners } = useDraggableHandle({
    id: CarbonDragHandleId,
    node: node as Node,
    disabled: !node,
    ref: handleRef,
    activationConstraint: {
      distance: 2
    }
  });

  const { DragRectComp, onDragRectProgress, onDragRectStop } = useDragRect({
    overlay: false
  });

  useEffect(() => {
    const onChange = (state) => {
      if (state.isContentChanged) {
        setShow(false);
      }
    };
    app.on(EventsOut.changed, onChange);
    return () => {
      app.off(EventsOut.changed, onChange);
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
      app.onEvent(EventsIn.dragStart, CustomEvent.create(EventsIn.dragStart, e.node, e.event));
      app.enable(() => {
        app.cmd.Select(PinnedSelection.fromNodes(e.node!), ActionOrigin.UserInput).Dispatch();
      });
    }
  }, [app]);

  const findHitNode = useCallback(
    (e: DndEvent) => {
      const {node} = e;
      const { clientX: x, clientY: y } = e.event;
      const el = app.store.element(node.id)
      const belBound = elementBound(el!)

      const bound = {
        minX: x - 10,
        minY: y - 10,
        maxX: x + 10,
        maxY: y + 10,
      };

      const hits = dnd.droppables.collides(bound);
      return hits[0];
    },
    [app, dnd]
  );

  const findDropPosition = useCallback(
    (e: DndEvent, hitNode: Node): Optional<Point> => {
      const firstChild = hitNode.firstChild;
      const hitTitleElement = app.store.element(firstChild!.id!);
      const hitElement = app.store.element(hitNode!.id!);
      const { top, bottom } = elementBound(hitTitleElement!);
      const elBound = elementBound(hitElement!);
      const {clientX, clientY} = e.event;
      const x = clientX;
      const y = clientY;

      let to: Optional<Point> = null;
      if (y < bottom) {
        if (y < top + (bottom - top) / 2) {
          to = Point.toBefore(hitNode);
          // if (dnd.accepts(hitNode, to)) {
          //   return to;
          // }
        } else {
          const hasChildren = true//hitNode.size > 1;
          if (
            hasChildren && x > elBound.left + 30 &&
            isNestableNode(hitNode)
          ) {

            to = Point.toAfter(firstChild?.id!);
          } else {
            to = Point.toAfter(hitNode);
          }
        }
      } else {
        to = Point.toAfter(hitNode);
      }

      return to;
    },
    [app.store]
  );

  const onDragOverNode = useCallback(
    (e: DndEvent) => {
      const { node } = e;
      const hitNode = findHitNode(e);
      console.log("hit node", hitNode?.id.toString());
      setShowDropHint(false);
      if (!hitNode) {
        return;
      }
      if (hitNode?.id.eq(node.id)) {
        return;
      }

      if (hitNode.isDocument) {
        return;
      }
      const isChildren = hitNode.chain.some((n) => n.eq(node));
      if (isChildren) {
        return;
      }

      // console.log("hits", hitNode?.id.toString());
      const to = findDropPosition(e, hitNode);
      const from = nodeLocation(node)!;
      if (!to) return
      // if (!to || from.eq(to) || to.isBefore && hitNode.prevSibling?.id.eq(node.id)) {
      //   return;
      // }

      const hitElement = app.store.element(to.nodeId);

      let { top, bottom, left, right, x, y } = elementBound(hitElement!);
      const width = right - left;
      const height = bottom - top;
      const offset = !to.nodeId.eq(hitNode.id) && hitNode.name == 'section' ? 30 : 0;
      if (to.isBefore) {
        // drop before the hit node
        console.log(x, y);
        const beforeNode = hitNode.prevSibling;

        if (beforeNode) {
          const beforeElement = app.store.element(beforeNode?.id!);
          const { bottom: beforeBottom = top } = elementBound(beforeElement!);
          top = top - (top - beforeBottom) / 2
        } else {
          top = top - 1;
        }
        setDropHintStyle({
          top,
          left: left + offset,
          width: width - offset,
        });
      } else {
        // drop after the hit node
        const afterElement = hitElement?.nextSibling as Optional<HTMLElement>;
        if (afterElement) {
          const { top: afterTop = bottom } = elementBound(afterElement);
          bottom = bottom + (afterTop - bottom) / 2
        }

        if (!to.nodeId.eq(hitNode.id)) {
          bottom = bottom + 1;
        }

        setDropHintStyle({
          top: bottom,
          left: left + offset,
          width: width - offset,
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
      setShowDropHint(false);

      if (!hitNode) return;
      if (hitNode.isDocument) return;
      if (hitNode?.id.eq(node.id)) {
        // hide drop hint
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
      if (!to || from.eq(to) || to.isBefore && hitNode.prevSibling?.id.eq(node.id)) {
        return;
      }

      app.enable(() => {
        app.parkCursor();

        const {tr} = app;
        const after = PinnedSelection.fromNodes(node)

        tr.Move(from, to, node.id).Select(PinnedSelection.fromNodes(node), ActionOrigin.UserInput);
        tr.Select(after, ActionOrigin.NoSync);
        tr.Dispatch();
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
        preventAndStop(e.event);
      } else {
        if (node.type.dragHandle) {
          app.parkCursor();
          app.cmd
            .Select(PinnedSelection.fromNodes(node), ActionOrigin.UserInput)
            ?.Dispatch();
        }
      }

      app.onEvent(EventsIn.dragUp, CustomEvent.create(EventsIn.dragDown, node, e.event));
    },
    [app]
  );

  const onMouseDown = useCallback(
    (node: Node, e) => {
      if (e.id !== CarbonDragHandleId) return;
      app.onEvent(EventsIn.dragDown, CustomEvent.create(EventsIn.dragDown, node, e.event));
    },
    []
  );

  useDndMonitor({
    onDragStart,
    onDragMove,
    onDragEnd,
    onMouseUp,
    onMouseDown,
    options: {
      throttle: 100,
    }
  });

  const handleInsertNode = (e) => {
    preventAndStop(e);

    if (!node) return;

    app.enable();
    app.focus();
    if (e.shiftKey) {
      const after = PinnedSelection.fromNodes([])
      app.cmd.inserter.before(node, "section")?.Dispatch();
      return;
    }

    // const { nextSibling: nextBlock } = node;
    // if (node.isEmpty && !node.isAtom && !nextBlock?.isEmpty) {
    //   const title = node.find((n) => n.isTextBlock);
    //   if (node.isContainerBlock && title) {
    //     const after = PinnedSelection.fromPin(Pin.toStartOf(title)!);
    //     if (app.selection.eq(after)) return;
    //     app.tr.Select(after, ActionOrigin.UserInput)?.Dispatch();
    //     return;
    //   }
    // }
    //
    // if (nextBlock && nextBlock?.isEmpty && !nextBlock?.isAtom) {
    //   const after = PinnedSelection.fromPin(Pin.toStartOf(nextBlock)!);
    //   if (app.selection.eq(after)) return;
    //   app.tr.Select(after, ActionOrigin.UserInput)?.Dispatch();
    //   return;
    // }

    app.cmd.inserter.after(node, "section").Dispatch();
  };

  return (
    <div
      className="carbon-node-handle"
      data-target-name={node?.name}
      data-drag-handle={node?.type.dragHandle}
      {...attributes}
      style={{ ...style, display: show ? "flex" : "none" }}
    >
      {!node?.type.dragHandle && <div className="carbon-drag-handle-cover"  ref={handleRef} {...listeners} />}
      {node?.type.dragHandle && <>
      <div
        className="carbon-add-handle"
        onClick={handleInsertNode}
        onMouseDown={preventAndStop}
      >
        <HiOutlinePlus />
      </div>
      <div
        className="carbon-drag-handle"
        onKeyDown={(e) => console.log(e)}
        ref={handleRef}
        {...listeners}
      >
        <PiDotsSixVerticalBold />
      </div></>}
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
