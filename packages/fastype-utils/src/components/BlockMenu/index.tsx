import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Carbon,
  Node,
  useCarbon,
  NodeType,
  preventAndStop,
  BlockContent,
  PinnedSelection,
  Pin,
} from "@emrgen/carbon-core";
import { blockIcons, useBlockMenu } from "@emrgen/carbon-utils";

import {
  HStack,
  Stack,
  List,
  ListItem,
  Portal,
  Square,
  Text,
  Flex,
  Box,
} from "@chakra-ui/react";
import { first, values } from "lodash";
import { node } from "@emrgen/carbon-blocks";
import { Optional } from "@emrgen/types";

interface BlockMenuProps {
  app: Carbon;
}

export function BlockMenu(props: BlockMenuProps) {
  const { app } = props;

  const [position, setPosition] = useState({ left: 0, top: 0 });
  const [show, setShow] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [node, setNode] = useState<Optional<Node>>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const ref = React.useRef<HTMLDivElement>(null);
  const plugin = app.plugin("blockMenu");

  // filter blocks by search text
  const blocks = useMemo(() => {
    return values(app.schema.nodes)
      .filter((n) => n.spec.insert)
      .filter((b) => {
        const nameMatch = b.spec?.info?.title
          ?.toLowerCase()
          .includes(searchText.toLowerCase());
        const tagMatch = b.spec?.info?.tags?.some((tag) =>
          tag.toLowerCase().includes(searchText.toLowerCase())
        );
        return (tagMatch || nameMatch) && b.name !== node?.name;
      });
  }, [app.schema.nodes, node, searchText]);

  // reset active index when blocks change
  useEffect(() => {
    setActiveIndex(0);
  }, [blocks]);

  const onShow = useCallback(
    (node: Node, el: HTMLElement) => {
      if (!plugin) return;
      const siblings = node.prevSiblings.map((n) => n.name);
      const parent = node.parent;
      if (!parent) return;
      const { left, top } = el.getBoundingClientRect();

      let height = parseInt(window.getComputedStyle(el).height);
      isNaN(height) && (height = 20);

      setPosition({ left, top: top + height + 4 });
      setShow(true);
      const { checked } = plugin?.state;
      checked.set(node.id.toString(), false);
      plugin.setState({ visible: true, checked });
      setSearchText(node.textContent.slice(1));
      setNode(node.parent);
    },
    [plugin]
  );

  const onHide = useCallback((node: Node) => {
    setPosition({ left: 0, top: 0 });
    setShow(false);
    setSearchText("");
    setNode(null);
  }, []);

  const handleSelect = useCallback(
    (type: NodeType) => {
      setShow(false);
      if (node) {
        app.tr
          .change(node?.id, node?.name, type.name)
          .setContent(node.child(0)!.id, BlockContent.create([]))
          .select(PinnedSelection.fromPin(Pin.future(node.child(0)!, 0)!)!)
          .dispatch();
      }
    },
    [app.tr, node]
  );

  const onSelect = useCallback(
    (node: Node) => {
      if (blocks.length === 0) return;
      const selected = blocks[activeIndex];
      if (!selected) return;
      handleSelect(selected);
    },
    [activeIndex, blocks, handleSelect]
  );

  const onScroll = useCallback(
    (direction) => {
      if (direction === "up") {
        setActiveIndex((i) => (i > 0 ? i - 1 : blocks.length - 1));
      } else {
        setActiveIndex((i) => (i < blocks.length - 1 ? i + 1 : 0));
      }
    },
    [blocks.length]
  );

  useBlockMenu({ app, onShow, onHide, onSelect, onScroll });

  return (
    <Portal>
      {show && blocks.length > 0 && (
        <Stack
          ref={ref}
          className="carbon-block-menu"
          style={position}
          boxShadow={"0 2px 12px 0 #ddd"}
          borderRadius={4}
          maxH={200}
          pos={"fixed"}
          bg={"white"}
          onMouseDown={preventAndStop}
          contentEditable={false}
          suppressContentEditableWarning={true}
        >
          <BlockList
            onSelect={handleSelect}
            blocks={blocks}
            activeIndex={activeIndex}
            onSelectIndex={setActiveIndex}
          />
        </Stack>
      )}
    </Portal>
  );
}

const BlockList = ({ onSelect, blocks, activeIndex, onSelectIndex }) => {
  const [scrolled, setScrolled] = useState(false);
  return (
    <Box
      overflow={"auto"}
      onScroll={() => {
        setScrolled(true);
      }}
    >
      <List px={2} py={2} minW={"360px"}>
        {blocks.map((b, index) => {
          return (
            <ListItem
              onClick={() => onSelect(b)}
              onMouseMove={() => {
                onSelectIndex(index);
              }}
              onMouseOver={() => {
                if (scrolled) {
                  onSelectIndex(index);
                }
              }}
              key={b.name}
              cursor={"pointer"}
              // _hover={{ bg: "#eee" }}
              _active={{ bg: "#ddd" }}
              bg={activeIndex === index ? "#eee" : "#fff"}
              p={1}
            >
              <HStack>
                <Square
                  size={12}
                  borderRadius={4}
                  border={"1px solid #eee"}
                  bg={"#fff"}
                  fontSize={20}
                  color={"#555"}
                >
                  {blockIcons[b.name] ?? ""}
                </Square>
                <Stack spacing={0}>
                  <Text>{b.spec.info.title}</Text>
                  <Text fontSize={13}>{b.spec.info.description}</Text>
                </Stack>
              </HStack>
            </ListItem>
          );
        })}
      </List>
    </Box>
  );
};
