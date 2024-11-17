import { Box, Portal, usePrevious } from "@chakra-ui/react";
import data from "@emoji-mart/data";
import { preventAndStop } from "@emrgen/carbon-core";
import { Picker } from "emoji-mart";
import EventEmitter from "events";
import React, { memo, ReactNode, useCallback, useEffect, useRef } from "react";

class EmojiPicker extends Picker {}

console.log(Picker, EmojiPicker);

interface EmojiPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (emoji: string) => void;
  children?: ReactNode;
  position?: { x: number; y: number };
  bus?: EventEmitter;
}

export function EmojiPickerInlineInner(props: EmojiPickerProps) {
  const { isOpen, onClose, onSelect, position, bus } = props;
  const ref = useRef<HTMLDivElement | null>(null);
  const [picker, setPicker] = React.useState<Picker | null>(null);
  const prevPicker = usePrevious(picker);

  const handleSelect = useCallback(
    (emoji) => {
      onClose();
      onSelect(emoji);
    },
    [onClose, onSelect],
  );

  useEffect(() => {
    if (ref.current === null) return;
    // if (prevPicker) return;

    const picker = new Picker({
      bus,
      parent: ref.current,
      data,
      onEmojiSelect: (emoji) => {
        handleSelect(emoji.native);
      },
      // onClickOutside: onClose,
      previewPosition: "none",
      navPosition: "bottom",
      searchPosition: "none",
      theme: "light",
    });
    setPicker(picker);

    console.log("---------------");

    return () => {
      if (ref.current === null) return;
      // eslint-disable-next-line react-hooks/exhaustive-deps
      ref.current.removeChild(ref.current.children[0]);
      setPicker(null);
    };
  }, [bus, handleSelect, isOpen, onClose, prevPicker]);

  return (
    <Portal>
      <Box
        zIndex="popover"
        onClick={(e) => preventAndStop(e)}
        onBlur={(e) => {
          preventAndStop(e);
          onClose();
        }}
        display={isOpen ? "block" : "none"}
        position={"fixed"}
        left={position?.x + "px"}
        top={(position?.y ?? 0) + 30 + "px"}
      >
        <div ref={ref}></div>
      </Box>
    </Portal>
  );
}

export const EmojiPickerInline = memo(EmojiPickerInlineInner);
