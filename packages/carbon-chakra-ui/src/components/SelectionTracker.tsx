import { EmptyInline, Mark, Node } from "@emrgen/carbon-core";
import { EventsOut } from "@emrgen/carbon-core";
import { PinnedSelection } from "@emrgen/carbon-core";
import { TitleNode } from "@emrgen/carbon-core";
import { MarkSet } from "@emrgen/carbon-core";
import React, { useMemo, useState } from "react";
import { useEffect } from "react";
import { useCallback } from "react";
import { useCarbon, useCarbonOverlay } from "@emrgen/carbon-react";
import {
  Box,
  Circle,
  HStack,
  IconButton,
  IconButtonProps,
  Portal,
} from "@chakra-ui/react";
import { BiBold, BiStrikethrough, BiUnderline } from "react-icons/bi";
import { debounce } from "lodash";
import { TbItalic } from "react-icons/tb";
import { RxCross2 } from "react-icons/rx";

// This function is used to collect all the marks in a selection
const collectMarks = (selection: PinnedSelection) => {
  const { start, end } = selection;

  const leaves: Node[] = [];
  if (!start.node.eq(end.node)) {
    const [, startBlock] = TitleNode.from(start.node).split(start.steps);
    const [endBlock] = TitleNode.from(end.node).split(end.steps);

    startBlock.children.forEach((n) => {
      leaves.push(n);
    });

    endBlock.children.forEach((n) => {
      leaves.push(n);
    });

    start.node.next(
      (n) => {
        if (n.eq(end.node)) {
          return true;
        }
        if (n.isFocusable) {
          leaves.push(n);
        }
        return false;
      },
      { order: "pre" },
    );
  } else {
    const [, middle] = TitleNode.from(start.node).split(start.steps, end.steps);
    middle.children.forEach((n) => {
      leaves.push(n);
    });
  }

  const markSet = MarkSet.from([]);

  leaves.some((n) => {
    const marks = n.marks;
    marks.forEach((m) => {
      markSet.add(m);
    });
  });

  return markSet;
};

export function SelectionTracker() {
  const app = useCarbon();
  const [showContextMenu, setShowContextMenu] = useState(false);
  const overlay = useCarbonOverlay();
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [marks, setMarks] = useState<MarkSet>(MarkSet.from([]));

  const hideContextMenu = useCallback(() => {
    setShowContextMenu(false);
    setMarks(MarkSet.from([]));
  }, [setMarks]);

  useEffect(() => {
    const onChange = debounce((e) => {
      const { state } = app;
      if (!app.committed) return;

      if (state.blockSelection.isActive) {
        setShowContextMenu(false);
        console.warn("block selection is active");
        return;
      }

      const { head, tail } = state.selection;
      const headDown = head.down();

      const tailDown = tail.down();
      if (
        head.eq(tail) ||
        (headDown.node.eq(tailDown.node) && EmptyInline.is(headDown.node))
      ) {
        hideContextMenu();
        return;
      }

      // don't show context menu if the selection is in the document title
      if (head.node.parent?.isDocument || tail.node.parent?.isDocument) {
        hideContextMenu();
        return;
      }

      const selection = window.getSelection();
      if (selection && !state.selection.isCollapsed) {
        const marks = collectMarks(state.selection);
        setMarks(marks);
        const { anchorNode, anchorOffset, focusNode, focusOffset } = selection;
        if (state.selection.isForward) {
          const range = new Range();
          range.setStart(anchorNode!, anchorOffset);
          range.setEnd(focusNode!, focusOffset);

          const rect = range.getBoundingClientRect();
          setRect(rect);
          setShowContextMenu(true);
        } else {
          const range = new Range();
          range.setStart(focusNode!, focusOffset);
          range.setEnd(anchorNode!, anchorOffset);

          const rect = range.getBoundingClientRect();
          setRect(rect);
          setShowContextMenu(true);
        }
      } else {
        hideContextMenu();
        setRect(null);
      }
    }, 100);

    const onSelectionUpdate = (e: MouseEvent) => {
      const { state } = app;
      if (!app.committed) return;
      const { selection } = state;
      if (selection.isCollapsed) {
        hideContextMenu();
        return;
      }
    };

    app.on(EventsOut.contentUpdated, onChange);
    app.contentElement?.addEventListener("mouseup", onChange);
    app.contentElement?.addEventListener("keyup", onChange);

    return () => {
      app.off(EventsOut.contentUpdated, onChange);
      // app.contentElement?.removeEventListener("mouseup", onChange);
      // app.contentElement?.removeEventListener("keyup", onChange);
    };
  }, [app, hideContextMenu, overlay]);

  const contextMenu = useMemo(() => {
    if (!showContextMenu) return null;
    if (!overlay.ref.current) return null;
    if (!rect) return null;

    return (
      <Portal>
        <Box
          pos={"absolute"}
          h={"34px"}
          w={0}
          zIndex={1000}
          left={rect?.left + "px"}
          top={rect?.top - 30 - 18 + "px"}
          overflow={"visible"}
        >
          <HStack
            pos={"relative"}
            align={"center"}
            h={"full"}
            p={1}
            bg={"white"}
            borderRadius={"md"}
            boxShadow={"0 3px 10px rgba(0,0,0,0.2)"}
            justify={"space-between"}
            w={"200px"}
            spacing={1}
          >
            <ContextButton
              aria-label={"bold"}
              icon={<BiBold />}
              bg={marks.has(Mark.BOLD) ? "gray.100" : "transparent"}
              onClick={() => {
                app.cmd.formatter.toggle(Mark.BOLD)?.dispatch();
              }}
            />
            <ContextButton
              aria-label={"italic"}
              icon={<TbItalic />}
              bg={marks.has(Mark.ITALIC) ? "gray.100" : "transparent"}
              onClick={() => {
                app.cmd.formatter.toggle(Mark.ITALIC)?.dispatch();
              }}
            />
            <ContextButton
              aria-label={"underline"}
              icon={<BiUnderline />}
              bg={marks.has(Mark.UNDERLINE) ? "gray.100" : "transparent"}
              onClick={() => {
                app.cmd.formatter.toggle(Mark.UNDERLINE)?.dispatch();
              }}
            />
            <ContextButton
              aria-label={"strike"}
              icon={<BiStrikethrough />}
              bg={marks.has(Mark.STRIKE) ? "gray.100" : "transparent"}
              onClick={() => {
                app.cmd.formatter.toggle(Mark.STRIKE)?.dispatch();
              }}
            />
            <ContextButton
              aria-label={"strike"}
              icon={<Circle size={4} bg={"#ffce26"} />}
              bg={
                marks.has(Mark.background("#ffce26"))
                  ? "gray.100"
                  : "transparent"
              }
              onClick={() => {
                app.cmd.formatter
                  .toggle(Mark.background("#ffce26"))
                  ?.dispatch();
              }}
            />
            <ContextButton
              aria-label={"strike"}
              icon={<Circle size={4} bg={"#8ae0ff"} />}
              bg={
                marks.has(Mark.background("#8ae0ff"))
                  ? "gray.100"
                  : "transparent"
              }
              onClick={() => {
                app.cmd.formatter
                  .toggle(Mark.background("#8ae0ff"))
                  ?.dispatch();
              }}
            />
            <ContextButton
              aria-label={"strike"}
              icon={<RxCross2 />}
              onClick={() => {
                app.cmd.formatter
                  .toggle(Mark.background("transparent"))
                  ?.dispatch();
              }}
            />
          </HStack>
        </Box>
      </Portal>
    );
  }, [showContextMenu, overlay.ref, rect, app.cmd.formatter, marks]);

  return <>{contextMenu}</>;
}

const ContextButton = (props: IconButtonProps) => {
  return (
    <IconButton
      size={"xs"}
      fontSize={"15px"}
      h={"26px"}
      w={"26px"}
      variant={"ghost"}
      {...props}
    />
  );
};
