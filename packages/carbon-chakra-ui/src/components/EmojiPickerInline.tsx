import { Box, Portal } from "@chakra-ui/react";

import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";

import { preventAndStop } from "@emrgen/carbon-core";
import React from "react";

interface EmojiPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (emoji: string) => void;
  children?: React.ReactNode;
  position?: { x: number; y: number };
}

export function EmojiPickerInline(props: EmojiPickerProps) {
  const { isOpen, onClose, onSelect, position } = props;

  const handleSelect = (emoji) => {
    onClose();
    onSelect(emoji);
  };

  console.log(position);

  return (
    <Portal>
      <Box
        zIndex="popover"
        onClick={onClose}
        onBlur={(e) => {
          preventAndStop(e);
          onClose();
        }}
        display={isOpen ? "block" : "none"}
        position={"fixed"}
        left={position?.x + "px"}
        top={(position?.y ?? 0) + 30 + "px"}
      >
        <Picker
          data={data}
          onEmojiSelect={handleSelect}
          navPosition={"bottom"}
          searchPosition={"none"}
          previewPosition={"none"}
          theme="light"
        />
      </Box>
    </Portal>
  );
}
