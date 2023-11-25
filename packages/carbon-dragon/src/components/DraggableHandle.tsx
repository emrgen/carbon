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
import { isNestableNode } from "@emrgen/carbon-blocks";

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
      distance: 2
    }
  });

  const { DragRectComp, onDragRectProgress, onDragRectStop } = useDragRect({
    overlay: false
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
      app.enable(() => {
        app.tr.selectNodes([])?.dispatch();
      });
    }
  }, [app]);

  const findHitNode = useCallback(
    (e: DndEvent) => {
      const { clientX: x, clientY: y } = e.event;
      const bound = {
        minX: x - 5,
        minY: y - 10,
        maxX: x + 5,
        maxY: y + 10,
      };

      const hits = dnd.droppables.collides(bound);
      return hits[0];
    },
    [dnd.droppables]
  );

  const findDropPosition = useCallback(
    (e: DndEvent, hitNode: Node): Optional<Point> => {
      const firstChild = hitNode.firstChild;
      const hitTitleElement = app.store.element(firstChild!.id!);
      const hitElement = app.store.element(hitNode!.id!);
      const { top, bottom } = elementBound(hitTitleElement!);
      const elBound = elementBound(hitElement!);

      let to: Optional<Point> = null;
      if (e.event.clientY < bottom) {
        if (e.event.clientY < top + (bottom - top) / 2) {
          to = Point.toBefore(hitNode);
        } else {
          const hasChildren = true//hitNode.size > 1;
          if (
            hasChildren && e.event.clientX > elBound.left + 30 &&
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
      if (!to || from.eq(to) || to.isBefore && hitNode.prevSibling?.id.eq(node.id)) {
        return;
      }

      const hitElement = app.store.element(to.nodeId);

      let { top, bottom, left, right, x, y } = elementBound(hitElement!);
      const width = right - left;
      const height = bottom - top;
      const offset = !to.nodeId.eq(hitNode.id) && hitNode.name == 'section' ? 30 : 0;

      if (to.isBefore) {
        console.log(x, y);
        const beforeNode = hitNode.prevSibling;
        const beforeElement = app.store.element(beforeNode?.id!);
        if (beforeElement) {
          const { bottom: beforeBottom = top } = elementBound(beforeElement!);
          top = top - (top - beforeBottom) / 2
        }
        setDropHintStyle({
          top,
          left: left + offset,
          width: width - offset,
        });
      } else {
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
                tr.move(from, to, node.id).selectNodes(node.id);
        const textBlock = node.find((n) => n.isTextBlock);
        if (textBlock) {
          const after = PinnedSelection.fromPin(Pin.toStartOf(textBlock!)!);
          tr.select(after, ActionOrigin.NoSync);
        }

        tr?.dispatch();
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
            // .select(
            //   PinnedSelection.fromPin(Pin.toStartOf(app.content)!)!,
            //   ActionOrigin.NoSync
            // )
            .selectNodes(node.id)
            ?.dispatch();
        }
      }
    },
    [app]
  );

  const onMouseDown = useCallback(
    (node: Node, e) => {
      if (e.id !== CarbonDragHandleId) return;
      // app.focus();
      // app.parkCursor();
      // app.tr
      //   .select(
      //     PinnedSelection.fromPin(Pin.toStartOf(app.content)!)!,
      //     ActionOrigin.NoSync
      //   )
      //   .then((app) => {
      //     return app.tr.select(
      //       PinnedSelection.fromPin(Pin.toStartOf(app.content)!)!,
      //       ActionOrigin.UserInput
      //     );
      //   })
      //   .dispatch();
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
      app.cmd.insert.before(node, "section")?.selectNodes([])?.dispatch();
      return;
    }

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
        onClick={handleInsertNode}
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
