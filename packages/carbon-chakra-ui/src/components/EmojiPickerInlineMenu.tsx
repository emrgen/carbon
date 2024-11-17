import { useDisclosure } from "@chakra-ui/react";
import { emoji } from "@emrgen/carbon-blocks";
import { Pin, PinnedSelection, TitleNode } from "@emrgen/carbon-core";
import { useCarbon } from "@emrgen/carbon-react";
import EventEmitter from "events";
import { round } from "lodash";
import { useCallback, useEffect, useRef, useState } from "react";
import { EmojiPickerInline } from "./EmojiPickerInline";

export const EmojiPickerInlineMenu = () => {
  const app = useCarbon();
  const { isOpen, onClose, onOpen } = useDisclosure();
  const [bus] = useState(new EventEmitter());
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const textRef = useRef("");

  // listen for show:emoji-picker and hide:emoji-picker events from the app
  useEffect(() => {
    const onShowEmojiPicker = (event) => {
      const { node, text } = event;
      console.log("Show emoji", text);
      onOpen();

      const after = app.selection.moveHead(-text.length + 1)?.collapseToHead();
      if (!after) return;
      const domSelection = after.intoDomSelection(app.store);
      if (!domSelection) return;

      const range = new Range();
      range.setStart(domSelection.anchorNode, domSelection.anchorOffset);
      range.setEnd(domSelection.focusNode, domSelection.focusOffset);
      const rect = range.cloneRange().getBoundingClientRect();

      setPosition((pos) => {
        const { x, y } = pos;
        if (round(x) === round(rect.left) && round(y) === round(rect.top)) {
          return pos;
        }

        return { x: rect.left, y: rect.top };
      });

      // emit search event to emoji picker
      console.log("searching for emoji", text);
      textRef.current = text;
      setTimeout(() => {
        bus.emit("search", {}, text.slice(1));
      }, 0);
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
  }, [app, bus, onClose, onOpen]);

  const handleSelectEmoji = useCallback(
    (emojiText: string) => {
      const { selection } = app;
      const { head } = selection;
      const tail = head.moveBy(-textRef.current.length)?.up();
      if (!tail) return;

      const emojiNode = app.schema.nodeFromJSON(emoji(emojiText));
      if (!emojiNode) return;

      // console.log(emojiNode);
      // console.log(textRef.current.length, head.toString(), tail.toString());
      const textBlock = TitleNode.from(head.node);
      const tmp = textBlock.removeInp(tail.steps, head.steps);
      // console.log("removed emoji match", tmp.textContent, tail.steps, head.steps);
      const titleBlock = tmp.insertInp(tail.steps, emojiNode);
      const endStepFromEnd = head.steps - head.node.stepSize;
      const endSteps = titleBlock.stepSize + titleBlock.mapStep(endStepFromEnd);
      const endOffset = head.offset - textRef.current.length + emojiText.length;
      // console.log(
      //   "steps to pin",
      //   textRef.current,
      //   titleBlock.stepSize,
      //   titleBlock.mapStep(endStepFromEnd),
      // );
      // console.log(endOffset, endSteps);
      const pin = Pin.create(titleBlock.node, endOffset, endSteps);

      const after = PinnedSelection.fromPin(pin)!;
      app.cmd
        .SetContent(head.node, titleBlock.children)
        .Select(after)
        .Dispatch();
    },
    [app],
  );

  return (
    <EmojiPickerInline
      isOpen={isOpen}
      onClose={onClose}
      onSelect={handleSelectEmoji}
      position={position}
      bus={bus}
    />
  );
};
