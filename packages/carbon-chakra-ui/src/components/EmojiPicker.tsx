import React from "react";

import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";

import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverHeader,
  PopoverBody,
  PopoverFooter,
  PopoverArrow,
  PopoverCloseButton,
  PopoverAnchor,
  Button,
  Portal,
  Box,
  BoxProps,
  PopoverArrowProps,
  PopoverProps,
} from "@chakra-ui/react";

import { preventAndStop, stop } from "@emrgen/carbon-core";

interface EmojiPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (emoji: string) => void;
  children?: React.ReactNode;
}

export function EmojiPicker(props: EmojiPickerProps) {
  const { isOpen, onClose, onSelect } = props;

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
          onBlur={e => {
            preventAndStop(e);
            onClose();
          }}
        >
          <PopoverContent onClick={stop}>
            <Picker data={data} onEmojiSelect={handleSelect} autoFocus />
          </PopoverContent>
        </Box>
      </Portal>
    </Popover>
  );
}
