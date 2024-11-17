import React from "react";

import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";

import { Box, Portal } from "@chakra-ui/react";

import { preventAndStop } from "@emrgen/carbon-core";

interface EmojiPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (emoji: string) => void;
  children?: React.ReactNode;
}

export function EmojiPickerInline(props: EmojiPickerProps) {
  const { isOpen, onClose, onSelect } = props;

  const handleSelect = (emoji) => {
    onClose();
    onSelect(emoji);
  };

  return (
    <Portal>
      <Box
        zIndex="popover"
        w="full"
        h="full"
        position={"fixed"}
        onClick={onClose}
        onBlur={(e) => {
          preventAndStop(e);
          onClose();
        }}
        display={isOpen ? "block" : "none"}
      >
        <Picker
          data={data}
          onEmojiSelect={handleSelect}
          navPosition={"bottom"}
          searchPosition={"none"}
          previewPosition={"none"}
        />
      </Box>
    </Portal>
  );
}
