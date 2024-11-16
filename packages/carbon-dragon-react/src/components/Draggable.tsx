import { Node } from "@emrgen/carbon-core";
import { DndEvent } from "@emrgen/carbon-dragon";
import { CSSProperties, ReactNode, useRef } from "react";
import { useMakeDraggable } from "../hooks/index";

interface DraggableProps {
  refCheck?: (ref: any, target?: any) => boolean;
  node: Node;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
  onDragStart?: (event: DndEvent) => void;
  onDragMove?: (event: DndEvent) => void;
  onDragEnd?: (event: DndEvent) => void;
  onMouseDown?: (event: DndEvent) => void;
  onMouseUp?: (event: DndEvent) => void;
}

export const Draggable = (props: DraggableProps) => {
  const {
    refCheck = (ref, target) => ref === target,
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
    handleRef: ref,
    refCheck,
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
    onMouseDown(event: DndEvent) {
      onMouseDown?.(event);
    },
    onMouseUp(event: DndEvent): void {
      onMouseUp?.(event);
    },
  });

  return (
    <div className={className} style={style} ref={ref} {...listeners}>
      {children}
    </div>
  );
};
