import { useDisclosure } from "@chakra-ui/react";
import { Node } from "@emrgen/carbon-core";
import { useCarbon } from "@emrgen/carbon-react";
import { Optional } from "@emrgen/types";
import { useCallback, useEffect, useState } from "react";
import { EmojiPickerInline } from "./EmojiPickerInline";

export const EmojiPickerInlineMenu = () => {
  const app = useCarbon();
  const { isOpen, onClose, onOpen } = useDisclosure();
  const [textBlock, setTextBlock] = useState<Optional<Node>>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  // listen for show:emoji-picker and hide:emoji-picker events from the app
  useEffect(() => {
    const onShowEmojiPicker = (event) => {
      const { node, text } = event;
      console.log("Show emoji", text);
      setTextBlock(node);
      onOpen();

      const after = app.selection.moveHead(-text.length + 1)?.collapseToHead();
      if (!after) return;
      const domSelection = after.intoDomSelection(app.store);
      if (!domSelection) return;

      const range = new Range();
      range.setStart(domSelection.anchorNode, domSelection.anchorOffset);
      range.setEnd(domSelection.focusNode, domSelection.focusOffset);
      const rect = range.cloneRange().getBoundingClientRect();

      setPosition({ x: rect.left, y: rect.top });
    };

    const onHideEmojiPicker = (event) => {
      onClose();
    };

    app.on("show:emoji-picker", onShowEmojiPicker);
    app.on("hide:emoji-picker", onHideEmojiPicker);

    return () => {
      app.off("show:emoji-picker", onShowEmojiPicker);
      app.off("hide:emoji-picker", onHideEmojiPicker);
    };
  }, [app, onClose, onOpen]);

  const handleSelectEmoji = useCallback(
    (emoji: any) => {
      console.log(emoji, textBlock, textBlock?.textContent);
    },
    [textBlock],
  );

  return (
    <EmojiPickerInline
      isOpen={isOpen}
      onClose={onClose}
      onSelect={handleSelectEmoji}
      position={position}
    />
  );
};
