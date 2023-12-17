import { useMemo, useRef } from "react";

import {
  CarbonBlock,
  CarbonNodeChildren,
  CarbonNodeContent,
  Pin,
  PinnedSelection,
  RendererProps,
  preventAndStop,
  useCarbon,
  useSelectionHalo,
  EmojiPath,
} from "@emrgen/carbon-core";
import {
  useCombineConnectors,
  useConnectorsToProps,
  useDragDropRectSelect,
} from "@emrgen/carbon-dragon";
import { Emoji } from "emoji-picker-react";
import { IconButton, useDisclosure } from "@chakra-ui/react";
import { EmojiPicker } from "@emrgen/fastype-utils";

export const Callout = (props: RendererProps) => {
  const { node } = props;
  const app = useCarbon();
  const { isOpen, onClose, onOpen } = useDisclosure();

  const ref = useRef(null);

  const selection = useSelectionHalo(props);
  const dragDropRect = useDragDropRectSelect({ node, ref });
  const connectors = useConnectorsToProps(
    useCombineConnectors(dragDropRect, selection)
  );


  const showEmojiPicker = (e) => {
    preventAndStop(e);
    console.log("showEmojiPicker");
    onOpen();
  };

  const onSelectEmoji = (emoji) => {
    console.log("onSelectEmoji", emoji);
    // node.attrs.node.emoji = emoji.unified;
    app.tr
      .updateProps(node.id, { node: { emoji: emoji.unified } })
      .select(PinnedSelection.fromPin(Pin.toStartOf(node)!)!)
      .dispatch();
    onClose();
  };

  const emoji = useMemo(() => {
    return node.properties.get<string>(EmojiPath) ?? "26a0-fe0f";
  },[node.properties])

  return (
    <CarbonBlock node={node} ref={ref} custom={connectors}>
      <CarbonNodeContent
        node={node}
        beforeContent={
          <div
            className="fastype-callout-icon"
            onMouseDown={preventAndStop}
            onMouseUp={preventAndStop}
            contentEditable={false}
            suppressContentEditableWarning
          >
            <IconButton
              bg={"transparent"}
              size={"xs"}
              aria-label="Search database"
              icon={
                <Emoji
                  unified={emoji}
                  size={18}
                />
              }
              onClick={showEmojiPicker}
            />
            {isOpen && (
              <EmojiPicker
                isOpen={isOpen}
                onClose={onClose}
                onSelect={onSelectEmoji}
              >
                <div></div>
              </EmojiPicker>
            )}
          </div>
        }
      />
      <CarbonNodeChildren node={node} />
      {selection.SelectionHalo}
    </CarbonBlock>
  );
};
