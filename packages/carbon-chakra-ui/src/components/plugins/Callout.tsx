import { Box, IconButton, useDisclosure } from "@chakra-ui/react";
import data from "@emoji-mart/data";
import {
  EmojiPath,
  Pin,
  PinnedSelection,
  preventAndStop,
} from "@emrgen/carbon-core";
import { useRectSelectable } from "@emrgen/carbon-dragon-react";
import {
  CarbonBlock,
  CarbonNodeChildren,
  CarbonNodeContent,
  customRenderPropComparator,
  RendererProps,
  useCarbon,
  useSelectionHalo,
} from "@emrgen/carbon-react";
import { init } from "emoji-mart";
import { Emoji } from "emoji-picker-react";
import { useCallback, useMemo, useRef } from "react";
import { EmojiPicker } from "../EmojiPicker";

await init({ data });

export const CalloutComp = (props: RendererProps) => {
  const { node, custom } = props;
  const app = useCarbon();
  const ref = useRef(null);
  useRectSelectable({ node, ref });
  const { SelectionHalo } = useSelectionHalo(props);
  const { isOpen, onClose, onOpen } = useDisclosure();

  const showEmojiPicker = useCallback(
    (e) => {
      preventAndStop(e);
      console.log("showEmojiPicker");
      onOpen();
    },
    [onOpen],
  );

  const onSelectEmoji = useCallback(
    (emoji) => {
      app.cmd
        .Update(node.id, {
          [EmojiPath]: emoji.unified,
        })
        .Select(PinnedSelection.fromPin(Pin.toStartOf(node)!)!)
        .Dispatch();

      onClose();
    },
    [app, node, onClose],
  );

  const emoji = useMemo(() => {
    return node.props.get<string>(EmojiPath) ?? "26a0-fe0f";
  }, [node]);

  const beforeComponent = useMemo(() => {
    console.log("beforeComponent", emoji, isOpen);
    const beforeComponent = (
      <Box
        className="ccout__icon"
        contentEditable={false}
        suppressContentEditableWarning={true}
        userSelect={"none"}
      >
        <IconButton
          bg={"transparent"}
          size={"xs"}
          aria-label="Search database"
          icon={<Emoji unified={emoji} size={18} />}
          onClick={showEmojiPicker}
        />
        {isOpen && (
          <EmojiPicker
            theme={"light"}
            isOpen={isOpen}
            onClose={onClose}
            onSelect={onSelectEmoji}
          >
            <div></div>
          </EmojiPicker>
        )}
      </Box>
    );

    return (
      <CarbonNodeContent
        node={node}
        custom={{ className: "ccout__ti" }}
        beforeContent={beforeComponent}
        wrap={true}
      />
    );
  }, [emoji, isOpen, node, onClose, onSelectEmoji, showEmojiPicker]);

  console.log(isOpen);

  return (
    <CarbonBlock
      node={node}
      custom={{ ...custom, "data-emoji-selector": isOpen }}
      ref={ref}
      comp={customRenderPropComparator}
    >
      {beforeComponent}
      <CarbonNodeChildren node={node} className={"ccout__cnest"} wrap={true} />
      {SelectionHalo}
    </CarbonBlock>
  );
};
