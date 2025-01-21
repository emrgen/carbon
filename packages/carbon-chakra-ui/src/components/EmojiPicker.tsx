import {
  Box,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Portal,
} from "@chakra-ui/react";

import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";

import { preventAndStop, stop } from "@emrgen/carbon-core";
import React from "react";

interface EmojiPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (emoji: string) => void;
  children?: React.ReactNode;
  theme?: "light" | "dark";
}

export function EmojiPicker(props: EmojiPickerProps) {
  const { isOpen, onClose, onSelect, theme } = props;

  const handleSelect = (emoji) => {
    console.log(emoji);
    onClose();
    onSelect(emoji);
  };

  return (
    <Popover isOpen={isOpen} placement="auto">
      <PopoverTrigger>{props.children}</PopoverTrigger>
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
        >
          <PopoverContent onClick={stop}>
            <Picker
              data={data["en"]}
              onEmojiSelect={handleSelect}
              autoFocus
              theme={theme}
            />
          </PopoverContent>
        </Box>
      </Portal>
    </Popover>
  );
}
