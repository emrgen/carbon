import { isNestableNode } from "@emrgen/carbon-blocks";
import {
  CollapsedPath,
  CustomEvent,
  DraggingNodePath,
  EventsIn,
  FocusOnInsertPath,
  Node,
  nodeLocation,
  PinnedSelection,
  Point,
  preventAndStop,
} from "@emrgen/carbon-core";
import {
  childHit,
  DndEvent,
  elementBound,
  isDragHitNode,
  nodeFromPoint,
} from "@emrgen/carbon-dragon";
import { useCarbon, useNodeState } from "@emrgen/carbon-react";
import { Optional } from "@emrgen/types";
import { clamp } from "lodash";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { HiOutlinePlus } from "react-icons/hi";
import { LuChevronDown, LuChevronRight } from "react-icons/lu";
import { PiDotsSixVerticalBold } from "react-icons/pi";
import { useDndMonitor } from "../hooks/useDndMonitor";
import { useDraggableHandle } from "../hooks/useDraggable";
import { useDragRect } from "../hooks/useDragRect";

export interface FastDragHandleProps {
  node: Node;
  style: any;
}

export const CarbonDragHandleId = "carbon-drag-handle";

export function NodeDragHandle(props: FastDragHandleProps) {
  const { node, style } = props;

  const app = useCarbon();

  const handleRef = useRef(null);
  const [show, setShow] = useState(false);
  const [showDropHint, setShowDropHint] = useState(false);
  const [dropHintClassNames, setDropHintClassNames] = useState<string[]>([]);
  const [dropHintStyle, setDropHintStyle] = useState({} as any);
  const { attributes } = useNodeState({ node });
  const [collapsed, setCollapsed] = useState(() => {
    return app.store.get(node.id)?.linkedProps?.props.get(CollapsedPath, false) ?? false;
  });

  useEffect(() => {
    setCollapsed(app.store.get(node.id)?.linkedProps?.props.get(CollapsedPath, false) ?? false);
  }, [app, node]);

  const { listeners } = useDraggableHandle({
    id: CarbonDragHandleId,
    node: node as Node,
    disabled: !node,
    ref: handleRef,
    activationConstraint: {
      distance: 2,
    },
  });

  const { DragRectComp, onDragRectProgress, onDragRectStop } = useDragRect({
    overlay: false,
  });

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

  const onDragStart = useCallback(
    (e: DndEvent) => {
      if (e.id === CarbonDragHandleId) {
        app.onEvent(EventsIn.dragStart, CustomEvent.create(EventsIn.dragStart, e.node, e.event));
        app.enable(() => {
          app.cmd
            .Update(e.node, {
              [DraggingNodePath]: true,
            })
            .SelectBlocks([])
            .Select(PinnedSelection.BLUR)
            .Dispatch();
        });
      }
    },
    [app],
  );

  // find the node that is hit by the drag event
  const findHitNode = useCallback(
    (e: DndEvent) => {
      const { node } = e;
      const { clientX: x, clientY: y } = e.event;
      let container = nodeFromPoint(app.store, x, y, isDragHitNode);

      // find the child container if the hit is with the page
      if (container?.isPage) {
        container = childHit(app.store, container, e.node, x, y, isDragHitNode);
      }

      return container;
    },
    [app],
  );

  const findDropPosition = useCallback(
    (e: DndEvent, hitNode: Node): Optional<Point> => {
      const firstChild = hitNode.firstChild;
      const { store } = app;

      const hitElement = store.element(hitNode!.id!);
      const elBound = elementBound(hitElement!);

      const { clientX: x, clientY: y } = e.event;

      if (hitNode.firstChild?.isTextContainer) {
        const hitTitleElement = store.element(firstChild!.id!);
        const { top, bottom } = elementBound(hitTitleElement!);

        const { clientX, clientY } = e.event;
        const x = clientX;
        const y = clamp(clientY, top, bottom);

        if (hitNode.type.dnd?.drop?.within) {
          if (y <= bottom && y >= top) {
            let to = Point.toInside(hitNode);

            // divide the node rect into 3 parts vertically

            if (y <= top + 2) {
              to = Point.toBefore(hitNode);
            }

            if (y >= bottom - 2) {
              to = Point.toAfter(firstChild!.id);
            }

            return to;
          }
        }

        let to: Optional<Point> = null;
        if (y < bottom) {
          if (y < top + (bottom - top) / 2) {
            to = Point.toBefore(hitNode);
            // if (dnd.accepts(hitNode, to)) {
            //   return to;
            // }
          } else {
            const hasChildren = hitNode.type.dnd?.drop?.nestable || hitNode.size > 1;
            const left = hitNode.type.dnd?.drop?.nestable?.left || 30;
            console.log("hasChildren", hasChildren);
            if (hasChildren && x > elBound.left + left && isNestableNode(hitNode)) {
              to = Point.toAfter(firstChild?.id!);
            } else {
              to = Point.toAfter(hitNode);
            }
          }
        } else {
          to = Point.toAfter(hitNode);
        }
        return to;
      } else {
        if (y < elBound.top + (elBound.bottom - elBound.top) / 2) {
          return Point.toBefore(hitNode);
        } else {
          return Point.toAfter(hitNode);
        }
      }
    },
    [app],
  );

  // show drop hint when dragging over a container that accepts the dragged node
  const onDragOverNode = useCallback(
    (e: DndEvent) => {
      const { node } = e;
      const { store } = app;
      const hitNode = findHitNode(e);

      setShowDropHint(false);
      if (!hitNode) {
        return;
      }

      // don't show drop hint if the hit node is the same as the dragged node
      if (hitNode?.id.eq(node.id)) {
        return;
      }

      if (hitNode.isPage) {
        return;
      }

      const isChildren = hitNode.parents.some((n) => n.eq(node));
      if (isChildren) {
        return;
      }

      const to = findDropPosition(e, hitNode);
      if (!to) return;
      const from = nodeLocation(node)!;
      // don't show drop hint if the final drop position is same as the current position
      if (!to || from.eq(to) || (to.isBefore && hitNode.prevSibling?.id.eq(node.id))) {
        return;
      }

      const hitElement = store.element(to.nodeId);

      let { top, bottom, left, right, x, y } = elementBound(hitElement!);
      console.log(hitElement, left);
      const width = right - left;
      const height = bottom - top;
      const refNode = store.get(to.nodeId);
      const className = `ref-node-${refNode?.name} hit-node-${hitNode.name}`;
      setDropHintClassNames([to.isBefore ? `before ${className}` : `after ${className}`]);

      // const offset = !to.nodeId.eq(hitNode.id) && hitNode.name == "paragraph" ? 30 : 0;
      if (to.isBefore) {
        // drop before the hit node
        const beforeNode = hitNode.prevSibling;

        if (beforeNode) {
          const beforeElement = store.element(beforeNode?.id!);
          const { bottom: beforeBottom = top } = elementBound(beforeElement!);
          top = top - (top - beforeBottom) / 2;
        } else {
          top = top - 1;
        }
        setDropHintStyle({
          top,
          left: left,
          width: width,
        });
      } else if (to.isAfter) {
        // drop after the hit node
        const afterElement = hitNode.nextSibling ? store.element(hitNode.nextSibling.id) : null;
        if (afterElement) {
          const { top: afterTop = bottom } = elementBound(afterElement);
          bottom = bottom + (afterTop - bottom) / 2;
        }

        if (!to.nodeId.eq(hitNode.id)) {
          // bottom = bottom + 1;
        }

        setDropHintStyle({
          top: bottom,
          left: left,
          width: width,
        });
      } else if (to.isWithin) {
        const afterElement = store.element(hitNode.firstChild!.id)!;
        const { top, left, right, bottom } = elementBound(afterElement);
        const width = right - left;
        const height = bottom - top;
        setDropHintStyle({
          top: top,
          left: left,
          width: width,
          height: height,
        });
      }

      setShowDropHint(true);
    },
    [app, findDropPosition, findHitNode],
  );

  const onDropNode = useCallback(
    (e: DndEvent) => {
      const { node } = e;
      const hitNode = findHitNode(e);
      setShowDropHint(false);

      if (!hitNode) return;
      if (hitNode.isPage) {
        return;
      }

      if (hitNode?.id.eq(node.id)) {
        // hide drop hint
        return;
      }

      // console.log("dropped on", hitNode?.id.toString());
      // TODO: check if hitNode is a container and drop node is accepted at the drop position
      // check if hit node is within the drop node (this is not allowed)
      const isChildren = hitNode.chain.some((n) => n.eq(node));
      if (isChildren) {
        console.warn("cannot drop on children");
        return;
      }

      // setShowDropHint(false);
      const from = nodeLocation(node)!;
      let to = findDropPosition(e, hitNode);
      if (to?.isWithin) {
        const refNode = app.store.get(to.nodeId)!;
        to = Point.toAfter(refNode.lastChild!.id);
      }

      if (!to || from.eq(to) || (to.isBefore && hitNode.prevSibling?.id.eq(node.id))) {
        return;
      }

      app.enable(() => {
        app.parkCursor();

        const { cmd } = app;
        const after = PinnedSelection.fromNodes(node);

        cmd.Move(from, to, node.id);
        cmd.SelectBlocks([node.id]);
        cmd.Dispatch();
      });
      // console.log("drag end");
    },
    [app, findDropPosition, findHitNode],
  );

  const onDragMove = useCallback(
    (e: DndEvent) => {
      if (e.id === CarbonDragHandleId) {
        onDragRectProgress(e);
        onDragOverNode(e);
      }
    },
    [onDragOverNode, onDragRectProgress],
  );

  const onDragEnd = useCallback(
    (e: DndEvent) => {
      if (e.id === CarbonDragHandleId) {
        onDragRectStop(e);
        app.cmd
          .Update(e.node, {
            [DraggingNodePath]: false,
          })
          .Dispatch();
        onDropNode(e);
      }
    },
    [app, onDragRectStop, onDropNode],
  );

  const onMouseUp = useCallback(
    (node: Node, e: DndEvent, isDragging: boolean) => {
      if (e.id !== CarbonDragHandleId) return;
      // react.focus();
      if (isDragging) {
        preventAndStop(e.event);

        app.onEvent(EventsIn.dragUp, CustomEvent.create(EventsIn.dragDown, node, e.event));
      } else {
        if (node.type.dnd?.handle) {
          app.parkCursor();
          app.cmd.SelectBlocks([node.id])?.Select(PinnedSelection.SKIP).Dispatch();

          const { event } = e;
          app.emit("show:context:menu", {
            event,
            node,
            placement: "left-start",
          });
        }
      }
    },
    [app],
  );

  const onMouseDown = useCallback(
    (node: Node, e) => {
      if (e.id !== CarbonDragHandleId) return;
      app.onEvent(EventsIn.dragDown, CustomEvent.create(EventsIn.dragDown, node, e.event));
    },
    [app],
  );

  useDndMonitor({
    onDragStart,
    onDragMove,
    onDragEnd,
    onMouseUp,
    onMouseDown,
    options: {
      throttle: 100,
    },
  });

  const handleInsertNode = (e) => {
    preventAndStop(e);

    if (!node) return;

    app.enable();
    app.focus();
    if (e.shiftKey) {
      const after = PinnedSelection.fromNodes([]);
      app.cmd.inserter.insertBeforeDefault(node, "paragraph")?.SelectBlocks([]).Dispatch();
      return;
    }

    // const { nextSibling: nextBlock } = node;
    // if (node.isEmpty && !node.isAtom && !nextBlock?.isEmpty) {
    //   const title = node.find((n) => n.isTextBlock);
    //   if (node.isContainerBlock && title) {
    //     const after = PinnedSelection.fromPin(Pin.toStartOf(title)!);
    //     if (react.selection.eq(after)) return;
    //     react.tr.Select(after, ActionOrigin.UserInput)?.Dispatch();
    //     return;
    //   }
    // }
    //
    // if (nextBlock && nextBlock?.isEmpty && !nextBlock?.isAtom) {
    //   const after = PinnedSelection.fromPin(Pin.toStartOf(nextBlock)!);
    //   if (react.selection.eq(after)) return;
    //   react.tr.Select(after, ActionOrigin.UserInput)?.Dispatch();
    //   return;
    // }

    app.cmd.inserter.insertAfterDefault(node, "paragraph").SelectBlocks([]).Dispatch();
  };

  const handleToggleCollapse = useCallback(
    (e) => {
      preventAndStop(e);
      if (node.isSandbox) {
        app.cmd.collapsible
          .toggle(app.store.get(node.id)!.linkedProps!)
          .Update(node.id, {
            [FocusOnInsertPath]: true,
          })
          .Dispatch()
          .Then(() => {
            setCollapsed((c) => !c);
          });
      } else {
        throw new Error("Cannot collapse non-sandbox node");
      }
    },
    [app, node],
  );

  return (
    <div
      className="carbon-node-handle"
      data-target-name={node?.name}
      data-drag-handle={!!node?.type.dnd?.handle}
      style={{ ...style, visibility: show ? "visible" : "hidden" }}
    >
      {/*if the node is draggable but without a handle use the entire region as handle*/}
      {/*{(!node?.type.dnd?.handle || node.type.dnd.handleBody) && (*/}
      {/*  <div className="carbon-drag-handle-cover" ref={handleRef} {...listeners} />*/}
      {/*)}*/}

      {node?.type.dnd?.handle && (
        <>
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
          </div>
          {node.type.spec.control?.collapse && (
            <div
              className="carbon-collapse-handle"
              onClick={handleToggleCollapse}
              onMouseDown={preventAndStop}
            >
              {collapsed ? <LuChevronRight /> : <LuChevronDown />}
            </div>
          )}
        </>
      )}

      {/*{createPortal(<>{DragRectComp}</>, document.body)}*/}

      {createPortal(
        <>
          <div
            className={"carbon-drop-hint " + dropHintClassNames.join(" ")}
            style={{
              // visibility: showDropHint ? "visible" : "hidden",
              ...dropHintStyle,
              position: "absolute",
            }}
          />
        </>,
        document.body,
      )}
    </div>
  );
}
