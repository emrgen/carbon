import React, { ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { Box, Flex, useDimensions } from "@chakra-ui/react";
import {
  RendererProps,
  constrain,
  stop,
  useCarbon,
  useCarbonOverlay,
} from "@emrgen/carbon-core";
import {
  DndEvent,
  useDndMonitor,
  useDraggable,
  useDraggableHandle,
} from "@emrgen/carbon-dragon";

interface MediaViewProps extends RendererProps {
  aspectRatio?: number;
  enable?: boolean;
  boundedComponent?: ReactNode;
}

const roundInOffset = (size: number, offset: number) => {
  return Math.round(size / offset) * offset;
};

export function MediaView(props: MediaViewProps) {
  const { node, enable, aspectRatio = 0.681944444, boundedComponent } = props;
  const app = useCarbon();
  const ref = useRef<HTMLDivElement>(null);
  const [initialSize, setInitialSize] = useState({ width: 0, height: 0 });
  const [width, setWidth] = useState(node.attrs.node.width ?? 0);
  const [height, setHeight] = useState(node.attrs.node.height ?? 0);
  const [documentWidth, setDocumentWidth] = useState(0);

  const [opacity, setOpacity] = React.useState(0);

  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const leftHandle = useDraggableHandle({
    node,
    ref: leftRef,
    id: "media-left-resizer",
  });
  const rightHandle = useDraggableHandle({
    node,
    ref: rightRef,
    id: "media-right-resizer",
  });
  const bottomHandle = useDraggableHandle({
    node,
    ref: bottomRef,
    id: "media-bottom-resizer",
  });

  const updateDocumentWidth = useCallback(() => {
    const document = node.parents.find((n) => n.isDocument);
    if (!document) return;
    const docEl = app.store.element(document.id);
    if (!docEl) return;
    const parentWidth = docEl.offsetWidth ?? 0;
    
    setDocumentWidth(parentWidth);
  },[app.store, node.parents])

  useEffect(() => {
    updateDocumentWidth();
  }, [updateDocumentWidth]);

  useEffect(() => {
    app.on("app:mounted", updateDocumentWidth);
    return () => {
      app.off("app:mounted", updateDocumentWidth);
    }
  },[app, updateDocumentWidth]);

  // useEffect(() => {
  //   window.addEventListener("resize", updateDocumentWidth);
  //   return () => {
  //     window.removeEventListener("resize", updateDocumentWidth);
  //   };
  // }, [app.store, node.parents, updateDocumentWidth]);

  const onDragStart = useCallback(
    (e: DndEvent) => {
      const { position } = e;
      setInitialSize({
        width: ref.current?.offsetWidth ?? 0,
        height: ref.current?.offsetHeight ?? 0,
      });
    },
    [ref]
  );

  const onDragMove = useCallback(
    (e: DndEvent) => {
      if (!node.id.eq(e.node.id)) return;
      const { position } = e;
      const { width, height } = initialSize;
      const { deltaX, deltaY } = position;
      const dx = roundInOffset(2 * deltaX, 50);
      const dy = roundInOffset(deltaY, 50);
      // console.log("dx", dx, "dy", dy, documentWidth);
      
      if (e.id === "media-left-resizer") {
        const nw = constrain(roundInOffset(width - dx, 50), 100, documentWidth);
        setWidth(nw);
        if (height / nw > aspectRatio) {
          setHeight(nw * aspectRatio);
        }
      } else if (e.id === "media-right-resizer") {
        const nw = constrain(roundInOffset(width + dx, 50), 100, documentWidth);
        setWidth(nw);
        if (height / nw > aspectRatio) {
          setHeight(nw * aspectRatio);
        }
      } else if (e.id === "media-bottom-resizer") {
        const nh = constrain(
          roundInOffset(height + dy, 50),
          100,
          aspectRatio * width
        );
        setHeight(nh);
      }
    },
    [aspectRatio, documentWidth, initialSize, node.id]
  );

  const onDragEnd = useCallback(
    (e: DndEvent) => {
      if (!node.id.eq(e.node.id)) return;
      app.tr
        .updateAttrs(node.id, {
          node: { width, height },
        })
        .dispatch();
    },
    [app.tr, height, node.id, width]
  );

  useDndMonitor({
    onDragStart,
    onDragMove,
    onDragEnd,
  });

  return (
    <Flex
      // top={0}
      position={"relative"}
      height={height ? height + "px" : node.attrs.node.height + "px" ?? "60px"}
      width={width ? width + "px" : "full"}
      justifyContent={node.attrs.node.justifyContent ?? "center"}
      transition={"width 0.3s, height 0.3s"}
      // bg="red"
    >
      <Flex
        ref={ref}
        top={0}
        pos={"absolute"}
        onMouseOver={() => setOpacity(1)}
        onMouseOut={() => setOpacity(0)}
        height={height ? height + "px" : "full"}
        width={width ? width + "px" : "full"}
        alignItems={"center"}
        overflow={"hidden"}
        maxW={documentWidth ? documentWidth + "px" : "full"}
        transition={"width 0.3s, height 0.3s"}
        // boxShadow={"0 0 0 10px rgba(0,0,0,0.1)"}
        className="media-view-bound"
      >
        {boundedComponent}
        {props.children}
        {enable && (
          <>
            <Flex
              ref={leftRef}
              pos={"absolute"}
              top={"50%"}
              left={2}
              h={"50px"}
              w={"6px"}
              bg={"rgba(0,0,0,0.5)"}
              borderRadius={4}
              transform={"translate(0, -50%)"}
              cursor={"ew-resize"}
              border={"1px solid rgba(255,255,255,0.8)"}
              opacity={opacity ? 1 : 0}
              transition={"opacity 0.2s ease-in-out"}
              {...leftHandle.listeners}
              {...leftHandle.attributes}
            />
            <Flex
              ref={rightRef}
              pos={"absolute"}
              top={"50%"}
              right={2}
              h={"50px"}
              w={"6px"}
              bg={"rgba(0,0,0,0.8)"}
              borderRadius={4}
              transform={"translate(0, -50%)"}
              cursor={"ew-resize"}
              border={"1px solid rgba(255,255,255,0.8)"}
              opacity={opacity ? 1 : 0}
              transition={"opacity 0.2s ease-in-out"}
              {...rightHandle.listeners}
              {...rightHandle.attributes}
            />
            <Flex
              ref={bottomRef}
              pos={"absolute"}
              bottom={2}
              left={"50%"}
              w={"50px"}
              h={"6px"}
              bg={"rgba(0,0,0,0.5)"}
              borderRadius={4}
              transform={"translate(-50%,0)"}
              cursor={"ns-resize"}
              border={"1px solid rgba(255,255,255,0.8)"}
              opacity={opacity ? 1 : 0}
              transition={"opacity 0.2s ease-in-out"}
              {...bottomHandle.listeners}
              {...bottomHandle.attributes}
            />
          </>
        )}
      </Flex>
    </Flex>
  );
}
