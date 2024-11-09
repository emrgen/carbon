import { Flex } from "@chakra-ui/react";
import { clamp } from "@emrgen/carbon-core";

import { DndEvent } from "@emrgen/carbon-dragon";
import { useDndMonitor, useDraggableHandle } from "@emrgen/carbon-dragon-react";
import { RendererProps, useCarbon } from "@emrgen/carbon-react";
import { useDocument } from '@emrgen/carbon-react-blocks';
import React, {
  ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

interface MediaViewProps extends RendererProps {
  aspectRatio?: number;
  enable?: boolean;
  boundedComponent?: ReactNode;
}

const roundInOffset = (size: number, offset: number) => {
  return Math.round(size / offset) * offset;
};

const snapValue = (value: number, snapTo: number, minOffset: number, maxOffset: number) => {
  if (snapTo + minOffset < value && value < snapTo + maxOffset) {
    return snapTo;
  }

  return value
}

export function ResizableContainer(props: MediaViewProps) {
  const { node, enable, aspectRatio = 0.681944444, boundedComponent } = props;
  const app = useCarbon();
  const {doc} = useDocument();

  const ref = useRef<HTMLDivElement>(null);
  const [initialSize, setInitialSize] = useState({ width: 0, height: 0 });
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const [documentWidth, setDocumentWidth] = useState(1000);
  const [documentPadding, setDocumentPadding] = useState(0);

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
    const parentWidth = docEl.getBoundingClientRect().width;
    const {paddingLeft} = window.getComputedStyle(docEl)

    setDocumentPadding(parseInt(paddingLeft.toString().replace("px", "")));
    setDocumentWidth(parentWidth);
  }, [app.store, node.parents]);

  useEffect(() => {
    app.on("document:mounted", updateDocumentWidth);
    return () => {
      app.off("document:mounted", updateDocumentWidth);
    };
  }, [app, updateDocumentWidth]);

  useEffect(() => {
    window.addEventListener("resize", updateDocumentWidth);
    return () => {
      window.removeEventListener("resize", updateDocumentWidth);
    };
  }, [updateDocumentWidth]);

  const onDragStart = useCallback((e: DndEvent) => {
    const { position, setState } = e;
    setState({
      width: ref.current?.offsetWidth ?? 0,
      height: ref.current?.offsetHeight ?? 0,
    });
  }, []);

  const onDragMove = useCallback(
    (e: DndEvent) => {
      if (!node.id.eq(e.node.id)) return;
      const { position, state } = e;
      const { width, height } = state;
      const { deltaX, deltaY } = position;
      const dx = roundInOffset(2 * deltaX, 50);
      const dy = roundInOffset(deltaY, 50);

      console.log("dx", dx, "dy", dy, documentWidth, width, height);

      if (e.id === "media-left-resizer") {
        console.log("left resizer", dx, width, documentWidth, documentPadding);
        let nw = clamp(roundInOffset(width - dx, 50), 100, documentWidth);
        nw = snapValue(nw, documentWidth - 2 * documentPadding, -40, 50);
        nw = snapValue(nw, documentWidth, -60, 10);
        setWidth(nw);
        setHeight(nw * aspectRatio);
      } else if (e.id === "media-right-resizer") {
        let nw = clamp(roundInOffset(width + dx, 50), 100, documentWidth);
        nw = snapValue(nw, documentWidth - 2 * documentPadding, -40, 50);
        nw = snapValue(nw, documentWidth, -60, 10);
        setWidth(nw);
        setHeight(nw * aspectRatio);
      } else if (e.id === "media-bottom-resizer") {
        let nh = clamp(
          roundInOffset(height + dy, 50),
          100,
          aspectRatio * width,
        );
        setHeight(nh);
      }
    },
    [aspectRatio, documentPadding, documentWidth, node.id],
  );

  const onDragEnd = useCallback(
    (e: DndEvent) => {
      if (!node.id.eq(e.node.id)) return;
      app.cmd
        .Update(node.id, {
          node: { width, height },
        })
        .Dispatch();
    },
    [app, height, node.id, width],
  );

  useDndMonitor({
    onDragStart,
    onDragMove,
    onDragEnd,
  });

  return (
    <Flex
      position={"relative"}
      left={"50%"}
      transform={"translateX(-50%)"}
      width={width ? width + 'px' : "full"}
      height={height ? height + "px" : "full"}
      minH={"100px"}
      maxW={documentWidth ? documentWidth + "px" : "full"}
      maxH={documentWidth ? documentWidth * aspectRatio + "px" : "full"}
      transition={"width 0.3s, height 0.3s"}
      borderRadius={4}
      overflow={"hidden"}
    >
      <Flex
        pos={"relative"}
        ref={ref}
        top={0}
        onMouseOver={() => setOpacity(1)}
        onMouseOut={() => setOpacity(0)}
        width={"full"}
        alignItems={"center"}
        overflow={"hidden"}
        transition={"width 0.3s, height 0.3s"}
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
