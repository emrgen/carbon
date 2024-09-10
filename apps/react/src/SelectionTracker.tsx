import { Mark } from "@emrgen/carbon-core";
import React, { useEffect, useMemo, useState } from "react";
import { useCarbon, useCarbonOverlay } from "@emrgen/carbon-react";
import {
  Box,
  HStack,
  IconButton,
  IconButtonProps,
  Portal,
} from "@chakra-ui/react";
import { BiBold, BiStrikethrough, BiUnderline } from "react-icons/bi";
import { debounce } from "lodash";
import { GoItalic } from "react-icons/go";

export default function SelectionTracker() {
  const app = useCarbon();
  const [showContextMenu, setShowContextMenu] = useState(false);
  const overlay = useCarbonOverlay();
  const [rect, setRect] = useState<DOMRect | null>(null);

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
      if (head.eq(tail)) {
        setShowContextMenu(false);
        return;
      }

      const selection = window.getSelection();
      if (selection && !state.selection.isCollapsed) {
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
        setShowContextMenu(false);
        setRect(null);
      }
    }, 100);

    app.contentElement?.addEventListener("mouseup", onChange);
    app.contentElement?.addEventListener("keyup", onChange);
    return () => {
      app.contentElement?.removeEventListener("mouseup", onChange);
      app.contentElement?.removeEventListener("keyup", onChange);
    };
  }, [app, overlay]);

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
            align={"center"}
            h={"full"}
            p={1}
            bg={"white"}
            borderRadius={"md"}
            boxShadow={"md"}
            w={"130px"}
          >
            <ContextButton
              aria-label={"bold"}
              icon={<BiBold />}
              onClick={() => {
                app.cmd.formatter.toggle(Mark.BOLD)?.dispatch();
              }}
            />
            <ContextButton
              aria-label={"italic"}
              icon={<GoItalic />}
              onClick={() => {
                app.cmd.formatter.toggle(Mark.ITALIC)?.dispatch();
              }}
            />
            <ContextButton
              aria-label={"underline"}
              icon={<BiUnderline />}
              onClick={() => {
                app.cmd.formatter.toggle(Mark.UNDERLINE)?.dispatch();
              }}
            />
            <ContextButton
              aria-label={"strike"}
              icon={<BiStrikethrough />}
              onClick={() => {
                app.cmd.formatter.toggle(Mark.STRIKE)?.dispatch();
              }}
            />
          </HStack>
        </Box>
      </Portal>
    );
  }, [showContextMenu, overlay.ref, rect, app.cmd.formatter]);

  return (
    <>
      {contextMenu}
      {/*{selections.map((s, i) => {*/}
      {/*  return (*/}
      {/*    <div className="carbon-selection-tracker__item" key={i}>*/}
      {/*      {`${i}: tail: ${s.tail.node.id.toString()}/${s.tail.offset} => head: ${s.head.node.id.toString()}/${s.head.offset}`}*/}
      {/*    </div>*/}
      {/*  );*/}
      {/*})}*/}
    </>
  );
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
