import { Node } from "@emrgen/carbon-core";
import { useCarbon } from "@emrgen/carbon-react";
import { useCallback, useEffect, useState } from "react";
import { EmojiPickerInline } from "./EmojiPickerInline";
import { useDisclosure } from "@chakra-ui/react";
import { Optional } from '@emrgen/types';

export const EmojiPickerInlineMenu = () => {
  const app = useCarbon();
  const { isOpen, onClose, onOpen } = useDisclosure();
  const [textBlock, setTextBlock] = useState<Optional<Node>>(null);

  // listen for show:emoji-picker and hide:emoji-picker events from the app
  useEffect(() => {
    const onShowEmojiPicker = (event) => {
      const { node, text } = event;
      console.log('Show emoji', text);
      setTextBlock(node);
      onOpen();
    };

    const onHideEmojiPicker = (event) => {
      onClose();
    };

    app.on('show:emoji-picker', onShowEmojiPicker);
    app.on('hide:emoji-picker', onHideEmojiPicker);

    return () => {
      app.off('show:emoji-picker', onShowEmojiPicker);
      app.off('hide:emoji-picker', onHideEmojiPicker);
    };
  },[app, onClose, onOpen]);

  const handleSelectEmoji = useCallback((emoji: any) => {
    console.log(emoji, textBlock, textBlock?.textContent);
  }, [textBlock]);

  return <EmojiPickerInline isOpen={isOpen} onClose={onClose} onSelect={handleSelectEmoji} />;
}
