import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Carbon,
  Node,
  useCarbon,
  NodeType,
  preventAndStop,
} from "@emrgen/carbon-core";
import { useBlockMenu } from "@emrgen/carbon-utils";

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
import { values } from "lodash";

interface BlockMenuProps {
  app: Carbon;
}

export function BlockMenu(props: BlockMenuProps) {
  const { app } = props;

  const [position, setPosition] = useState({ left: 0, top: 0 });
  const [show, setShow] = useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  const plugin = app.plugin("blockMenu");

  const onShow = useCallback((block: Node, el: HTMLElement) => {
    if (!plugin) return;
    const siblings = block.prevSiblings.map((n) => n.name);
    const parent = block.parent;
    if (!parent) return;
    const { left, top } = el.getBoundingClientRect();

    let height = parseInt(window.getComputedStyle(el).height);
    isNaN(height) && (height = 20);

    setPosition({ left, top: top + height + 4 });
    setShow(true);
    plugin.setState({visible: true})
    // console.log("block", el, height + "x");
  }, [plugin]);

  const onHide = useCallback((node: Node) => {
    setPosition({ left: 0, top: 0 });
    setShow(false);
    const {checked} = plugin?.state;
    checked.set(node.id.toString(), true)
    plugin?.setState({ visible: false, checked })
  }, [plugin]);

  useBlockMenu({ app, onShow, onHide });

  const handleSelect = useCallback((type: NodeType) => {
    setShow(false);
    // app.insertBlock(block);
  }, []);

  const blockList = useMemo(() => {
    return <BlockList app={app} onSelect={handleSelect} filter={[]} />;
  }, [app, handleSelect]);

  return (
    <Portal>
      {show && (
        <Stack
          ref={ref}
          className="carbon-block-menu"
          style={position}
          boxShadow={"0 2px 12px 0 #ddd"}
          borderRadius={4}
          maxH={100}
          overflow={"auto"}
          pos={"absolute"}
          bg={"white"}
          onMouseDown={preventAndStop}
          contentEditable={false}
          suppressContentEditableWarning={true}
        >
          {blockList}
        </Stack>
      )}
    </Portal>
  );
}

const BlockList = ({ app, onSelect, filter }) => {
  const [blocks] = useState(() => {
    return values(app.schema.nodes)
      .filter((n) => n.spec.insert)
      .map((n) => {
        const { info = {} } = n.spec;
        return { ...info, name: n.name, type: n };
      });
  });

  return (
    <List px={2} py={2}>
      {blocks.map((b) => {
        return (
          <ListItem
            onClick={onSelect}
            key={b.name}
            cursor={"pointer"}
            _hover={{ bg: "#eee" }}
            p={1}
          >
            <HStack>
              <Square
                size={12}
                borderRadius={4}
                border={"1px solid #eee"}
                bg={"#fff"}
              ></Square>
              <Stack spacing={0}>
                <Text>{b.title}</Text>
                <Text fontSize={13}>{b.description}</Text>
              </Stack>
            </HStack>
          </ListItem>
        );
      })}
    </List>
  );
};
