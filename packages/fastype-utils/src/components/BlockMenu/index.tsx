import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Carbon,
  Node,
  NodeType,
  preventAndStop,
  PinnedSelection,
  Pin,
  Point,
} from "@emrgen/carbon-core";
import { blockIcons, useBlockMenu } from "@emrgen/carbon-utils";
import { useOverflowDetector } from "react-detectable-overflow";

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
import { first, sortBy, values, xorBy } from "lodash";
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
    const blocks = values(app.schema.nodes)
      .filter((n) => n.spec.insert)
      .filter((b) => {
        const nameMatch = b.spec?.info?.title
          ?.toLowerCase()
          .includes(searchText.toLowerCase());
        const tagMatch = b.spec?.info?.tags?.some((tag) =>
          tag.toLowerCase().includes(searchText.toLowerCase())
        );
        return (tagMatch || nameMatch) && b.name !== node?.name;
      })
      return sortBy(blocks, 'spec.info.order', 'spec.info.title');
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
      // const { checked } = plugin?.state;
      // checked.set(node.id.toString(), false);
      // plugin.setState({ visible: true, checked });
      // setSearchText(node.textContent.slice(1));
      // setNode(node.parent);
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
      if (!node) return;

      const { tr } = app;
      tr.Change(node?.id, type.name)
      tr.SetContent(node.child(0)!.id, []);
      tr.Update(node.id, {
        node: { typeChanged: true },
        // html: { "data-as": type.name },
      });
      if (type.isAtom && type.isBlock) {
        app.parkCursor();
        // tr.selectNodes(node.id);
      } else if (!type.isAtom && node.child(0)?.find((n) => n.hasFocusable)) {
        tr.Select(PinnedSelection.fromPin(Pin.future(node.child(0)!, 0)!)!);
      }

      // console.log(window.getSelection());

      tr.Dispatch();
    },
    [app, node]
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
        setActiveIndex((i) => (i > 0 ? i - 1 : 0));
      } else {
        setActiveIndex((i) =>
          i < blocks.length - 1 ? i + 1 : blocks.length - 1
        );
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
          maxH={300}
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
  const [scrollTop, setScrollTop] = useState(0);

  const ref = React.useRef<HTMLDivElement>(null);
  const listRef = React.useRef<HTMLUListElement>(null);

  // check if the active block is visible
  // otherwise scroll to it
  useEffect(() => {
    if (!ref.current) return;
    if (!listRef.current) return;
    const active = listRef.current.children[activeIndex];
    if (!active) return;

    const { top, bottom } = active.getBoundingClientRect();
    const { top: parentTop, bottom: parentBottom } =
      ref.current.getBoundingClientRect();

    if (top < parentTop) {
      setScrollTop((s) => s - (parentTop - top) - 4);
    } else if (bottom > parentBottom) {
      setScrollTop((s) => s - (parentBottom - bottom) + 4);
    }
  }, [activeIndex]);

  // scroll to show the active block
  useEffect(() => {
    if (!ref.current) return;
    ref.current.scrollTop = scrollTop;
  }, [scrollTop]);

  console.log(blocks.map(b => b.name));

  return (
    <Box
      ref={ref}
      overflow={"auto"}
      onScroll={() => {
        setScrolled(true);
      }}
    >
      <List ref={listRef} px={2} py={2} w={"300px"}>
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
              pos="relative"
            >
              <HStack>
                <Square
                  size={12}
                  borderRadius={4}
                  border={
                    index === activeIndex ? "1px solid #ddd" : "1px solid #eee"
                  }
                  bg={"#fff"}
                  fontSize={20}
                  color={"#555"}
                >
                  {blockIcons[b.name] ?? ""}
                </Square>
                <Stack spacing={0} flex={1} overflow={"hidden"}>
                  <Text>{b.spec.info.title}</Text>
                  <Text
                    fontSize={13}
                    overflow={"hidden"}
                    whiteSpace={"nowrap"}
                    textOverflow={"ellipsis"}
                  >
                    {b.spec.info.description}
                  </Text>
                </Stack>
              </HStack>
            </ListItem>
          );
        })}
      </List>
    </Box>
  );
};
