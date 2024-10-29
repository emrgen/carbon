import { Node } from "@emrgen/carbon-core";
import { DndEvent } from "@emrgen/carbon-dragon";
import { CSSProperties, ReactNode, useRef } from "react";
import { useMakeDraggable } from "../hooks/index";

interface DraggableProps {
  node: Node;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
  onDragStart?: (event: DndEvent) => void;
  onDragMove?: (event: DndEvent) => void;
  onDragEnd?: (event: DndEvent) => void;
  onMouseDown?: (node: Node, event: MouseEvent) => void;
  onMouseUp?: (node: Node, event: DndEvent) => void;
}

export const Draggable = (props: DraggableProps) => {
  const {
    children,
    className,
    style,
    node,
    onDragEnd,
    onDragMove,
    onDragStart,
    onMouseDown,
    onMouseUp,
  } = props;
  const ref = useRef<HTMLDivElement>(null);

  const { listeners } = useMakeDraggable({
    node,
    ref,
    distance: 4,
    onDragEnd(event: DndEvent): void {
      onDragEnd?.(event);
    },
    onDragMove(event: DndEvent): void {
      onDragMove?.(event);
    },
    onDragStart(event: DndEvent): void {
      onDragStart?.(event);
    },
    onMouseDown(node: Node, event: MouseEvent) {
      onMouseDown?.(node, event);
    },
    onMouseUp(node: Node, event: DndEvent): void {
      onMouseUp?.(node, event);
    },
  });

  return (
    <div className={className} style={style} ref={ref} {...listeners}>
      {children}
    </div>
  );
};