import {
  Box,
  HStack,
  List,
  ListItem,
  Portal,
  Square,
  Stack,
  Text,
} from "@chakra-ui/react";
import {
  Fragment,
  Node,
  NodeType,
  Pin,
  PinnedSelection,
  Point,
  preventAndStop,
} from "@emrgen/carbon-core";
import { useCarbon } from "@emrgen/carbon-react";
import { blockIcons, useBlockMenu } from "@emrgen/carbon-utils";
import { Optional } from "@emrgen/types";
import { sortBy, values } from "lodash";
import React, { useCallback, useEffect, useMemo, useState } from "react";

interface BlockMenuProps {}

export function InsertBlockMenu(props: BlockMenuProps) {
  const app = useCarbon();
  const [position, setPosition] = useState({ left: 0, top: 0 });
  const [show, setShow] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [node, setNode] = useState<Optional<Node>>(null);
  const [pluginState, setPluginState] = useState(new Map());
  const [activeIndex, setActiveIndex] = useState(0);
  const ref = React.useRef<HTMLDivElement>(null);
  const bodyRef = React.useRef<HTMLElement>(window.document.body);
  const plugin = app.plugin("blockMenu");

  // filter blocks by search text
  // TODO: use minisearch library to improve search performance and match results
  const blocks = useMemo(() => {
    const blocks = values(app.schema.nodes)
      .filter((n) => n.spec.insert)
      .filter((n) => n.name !== node?.parent?.name)
      .filter((b) => {
        const nameMatch = b.spec?.info?.title
          ?.toLowerCase()
          .includes(searchText.toLowerCase());
        const tagMatch = b.spec?.info?.tags?.some((tag) =>
          tag.toLowerCase().includes(searchText.toLowerCase()),
        );

        return (tagMatch || nameMatch) && b.name !== node?.name;
      });
    return sortBy(blocks, "spec.info.order", "spec.info.title");
  }, [app.schema.nodes, node, searchText]);

  // reset active index when blocks change
  useEffect(() => {
    setActiveIndex(0);
  }, [blocks]);

  const onShow = useCallback(
    (node: Node, state: Map<string, any>) => {
      if (!plugin) return;
      const siblings = node.prevSiblings.map((n) => n.name);
      const parent = node.parent;
      if (!parent) return;
      const el = app.store.element(node.id);
      if (!el) return;

      const { left, top } = el.getBoundingClientRect();

      let height = parseInt(window.getComputedStyle(el).height);
      isNaN(height) && (height = 20);
      setPosition({ left, top: top + height + 4 });
      setShow(true);
      setSearchText(node.textContent.slice(1));
      setNode(node);
      setPluginState(state);
      // TODO: check if this can be removed and done in a better way
      state.set("visible", true);
    },
    [app, plugin],
  );

  const onHide = useCallback(() => {
    if (!node) return;
    setPosition({ left: 0, top: 0 });
    setShow(false);
    setSearchText("");
    setNode(null);
    // TODO: check if this can be removed and done in a better way
    pluginState.set("visible", false);
    pluginState.get("checked")?.set(node.id.toString(), true);
  }, [node, pluginState]);

  const handleSelect = useCallback(
    (type: NodeType) => {
      setShow(false);
      if (!node) return;
      const { parent } = node;
      if (!parent) return;

      const { tr } = app;

      // check if the parent block can be changed to the selected block
      const match = type.contentMatch.matchFragment(
        Fragment.from(parent.children),
      );
      if (match) {
        tr.Change(parent?.id, type.name);
        tr.SetContent(node.id, []);
        tr.Update(parent.id, {
          node: { typeChanged: true },
        });
        if (type.isAtom && type.isBlock) {
          app.parkCursor();
        } else if (
          !type.isAtom &&
          parent.child(0)?.find((n) => n.hasFocusable)
        ) {
          tr.Select(PinnedSelection.fromPin(Pin.future(parent.child(0)!, 0)!)!);
        }

        tr.Dispatch();
        return;
      }

      // if the parent block can't be changed to the selected block, insert the block before the parent block
      const block = type.default();
      if (!block) return;
      const after = PinnedSelection.fromPin(Pin.future(node, 0))!;

      tr.Insert(Point.toBefore(parent.id), block);
      tr.SetContent(node.id, []);
      tr.Select(after);
      tr.Dispatch();
    },
    [app, node],
  );

  const onSelect = useCallback(
    (node: Node) => {
      if (blocks.length === 0) return;
      const selected = blocks[activeIndex];
      if (!selected) return;
      handleSelect(selected);
    },
    [activeIndex, blocks, handleSelect],
  );

  const onScroll = useCallback(
    (direction) => {
      if (direction === "up") {
        setActiveIndex((i) => (i > 0 ? i - 1 : 0));
      } else {
        setActiveIndex((i) =>
          i < blocks.length - 1 ? i + 1 : blocks.length - 1,
        );
      }
    },
    [blocks],
  );

  useEffect(() => {
    if (blocks.length === 0) {
      onHide();
    }
  }, [blocks, onHide]);

  useBlockMenu({ app, onShow, onHide, onSelect, onScroll });

  // console.log(show, blocks);
  return (
    <Portal containerRef={bodyRef}>
      {show && (
        <Stack
          ref={ref}
          className="carbon-block-menu"
          style={position}
          boxShadow={"0 2px 12px 0 #ddd"}
          borderRadius={4}
          maxH={300}
          zIndex={10000}
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

  console.log(blocks.map((b) => b.name));

  return (
    <Box
      ref={ref}
      overflow={"auto"}
      onScroll={() => {
        setScrolled(true);
      }}
    >
      <List ref={listRef} px={2} py={2} w={"300px"} spacing={1}>
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
              px={2}
              py={1.5}
              borderRadius={4}
              pos="relative"
            >
              <HStack>
                <Square
                  // size={12}
                  borderRadius={4}
                  // border={
                  //   index === activeIndex ? "1px solid #ddd" : "1px solid #eee"
                  // }
                  // bg={"#fff"}
                  fontSize={18}
                  color={"#555"}
                >
                  {blockIcons[b.name] ?? ""}
                </Square>
                <HStack
                  spacing={0}
                  flex={1}
                  overflow={"hidden"}
                  justifyContent={"space-between"}
                >
                  <Text fontSize={13}>{b.spec.info.title}</Text>
                  <Text
                    fontSize={13}
                    overflow={"hidden"}
                    whiteSpace={"nowrap"}
                    textOverflow={"ellipsis"}
                    color={"#aaa"}
                  >
                    {b.spec.info.shortcut}
                  </Text>
                </HStack>
              </HStack>
            </ListItem>
          );
        })}
      </List>
    </Box>
  );
};
