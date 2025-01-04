import { Box, Flex, Text } from "@chakra-ui/react";
import React, { useEffect, useMemo, useState } from "react";
import "./mmap.styl"; // INode interface for node object in the graph

// INode interface for node object in the graph
interface INode {
  active: boolean;
  id: number;
  x: number;
  y: number;
  h: number;
  w: number;
  text: string;
}

const createNode = ({ id, x = 0, y = 0, h = 32, w = 40, text }) => {
  return { id, x, y, h, w, text, active: false } as INode;
};

export const MMap = () => {
  const [nodes, setNodes] = useState<INode[]>([
    createNode({ id: 1, x: 500, y: 500, h: 0, text: "root" }),
    createNode({ h: 0, x: 0, y: 0, id: 2, text: "2" }),
    createNode({ id: 3, text: "3" }),
    createNode({ id: 4, text: "4" }),
    createNode({ id: 5, text: "5" }),
    createNode({ id: 6, text: "6" }),
    createNode({ id: 7, text: "7" }),
    createNode({ id: 8, text: "8" }),
    createNode({ id: 9, text: "9" }),
    createNode({ id: 10, text: "10" }),
  ]);

  const [activeNode, setActiveNode] = useState<INode | null>(null);

  const [relations, setRelations] = useState({
    1: [2, 3],
    2: [4, 5],
    3: [6, 7],
    4: [8, 9],
    5: [10],
  });

  // listen for key press
  useEffect(() => {
    const parents: Record<string, string> = {};
    for (const [parent, children] of Object.entries(relations)) {
      children.forEach((child) => {
        parents[child] = parent;
      });
    }

    const handleKeyDown = (e) => {
      if (e.key === "ArrowRight" && activeNode) {
        const children = relations[activeNode.id];
        if (!children) return;
        const nextChild = children[0];
        const node = nodes.find((node) => node.id === nextChild);
        if (!node) return;
        setActiveNode(node);
      }

      if (e.key === "ArrowLeft" && activeNode) {
        const parent = nodes.find((node) =>
          relations[node.id]?.includes(activeNode.id),
        );
        if (!parent) return;
        setActiveNode(parent);
      }

      if (e.key === "ArrowUp" && activeNode) {
        // find prev sibling if any
        const parent = parents[activeNode.id];
        const siblings = relations[parent];
        const index = siblings.findIndex(
          (sibling) => sibling === activeNode.id,
        );
        const prevSibling = siblings[index - 1];
        if (prevSibling) {
          const node = nodes.find((node) => node.id === prevSibling);
          if (node) setActiveNode(node);
        } else {
          // find parents prev sibling
          const grandParent = parents[parent];
          if (!grandParent) return;
          const grandSiblings = relations[grandParent];
          const grandIndex = grandSiblings.findIndex(
            (sibling) => sibling === parent,
          );
          const prevParent = grandSiblings[grandIndex - 1];
          // find last child of prev parent
          const prevChildren = relations[prevParent];
          const lastChild = prevChildren[prevChildren.length - 1];
          const node = nodes.find((node) => node.id === lastChild);
          if (node) setActiveNode(node);
        }
      }

      if (e.key === "ArrowDown" && activeNode) {
        // find next sibling if any
        const parent = parents[activeNode.id];
        const siblings = relations[parent];
        const index = siblings.findIndex(
          (sibling) => sibling === activeNode.id,
        );
        const nextSibling = siblings[index + 1];
        if (nextSibling) {
          const node = nodes.find((node) => node.id === nextSibling);
          if (node) setActiveNode(node);
        } else {
          // find parents next sibling
          const grandParent = parents[parent];
          if (!grandParent) return;
          const grandSiblings = relations[grandParent];
          const grandIndex = grandSiblings.findIndex(
            (sibling) => sibling === parent,
          );
          const nextParent = grandSiblings[grandIndex + 1];
          // find first child of next parent
          const nextChildren = relations[nextParent];
          const firstChild = nextChildren[0];
          const node = nodes.find((node) => node.id === firstChild);
          if (node) setActiveNode(node);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeNode, nodes, relations]);

  // calculate position of each child node from parent node position
  const updateChildPosition = (parentId: number) => {
    const parent = nodes.find((node) => node.id === parentId);
    if (!parent) return;
    const children = relations[parentId];
    console.log(children);
    if (!children) return;

    const newParent = { ...parent };
    newParent.h = children.reduce(
      (acc, childId) => {
        const child = nodes.find((node) => node.id === childId);
        if (!child) return acc;
        return acc + child.h;
      },
      (children.length - 1) * 20,
    );

    // set height of parent node
    if (newParent.h !== parent.h) {
      setNodes([...nodes.filter((node) => node.id !== parentId), newParent]);
    }

    let y = parent.y;

    // set position of each child node
    children.forEach((childId, i) => {
      const child = nodes.find((node) => node.id === childId);
      if (!child) return;
      const newChild = { ...child };

      newChild.x = parent.x + 100;
      newChild.y = y + i * 20;
      y += newChild.h;

      if (newChild.x !== child.x || newChild.y !== child.y) {
        setNodes([...nodes.filter((node) => node.id !== childId), newChild]);
      }
    });
  };

  // update position of the child nodes first during a dfs traversal
  useEffect(() => {
    const dfs = (nodeId: number) => {
      updateChildPosition(nodeId);
      const children = relations[nodeId];
      if (!children) return;
      children.forEach((childId) => {
        dfs(childId);
      });
    };

    dfs(1);
  }, [relations, updateChildPosition]);

  const edges = useMemo(() => {
    const edges: { from: INode; to: INode }[] = [];
    for (const [parent, children] of Object.entries(relations)) {
      children.forEach((child) => {
        const from = nodes.find((node) => node.id === Number(parent));
        const to = nodes.find((node) => node.id === child);
        if (from && to) edges.push({ from, to });
      });
    }
    return edges;
  }, [nodes, relations]);

  return (
    <Box pos={"absolute"} w="full" h={"full"} className={"canvas-background"}>
      <Box pos={"absolute"} h={"full"} w={"full"}>
        <svg width={"1488"} height={"1320"}>
          {edges.map((edge, i) => (
            <Edge key={i} from={edge.from} to={edge.to} />
          ))}
        </svg>
      </Box>
      <Box pos={"absolute"} h={"full"} w={"full"}>
        {nodes.map((node, i) => (
          <Node
            key={i}
            node={node}
            setNodes={setNodes}
            nodes={nodes}
            relations={relations}
            setRelations={setRelations}
            isActive={activeNode?.id === node.id}
            setActive={(node) => setActiveNode(node)}
          />
        ))}
      </Box>
    </Box>
  );
};

const Node = ({
  node,
  setNodes,
  nodes,
  relations,
  setRelations,
  isActive,
  setActive,
}) => {
  return (
    <Flex
      pos={"absolute"}
      py={1}
      px={2}
      cursor={"pointer"}
      borderRadius={4}
      bg={!isActive ? "#555" : "blue.300"}
      color={"white"}
      style={{ left: node.x, top: node.y, width: node.w }}
      onClick={(e) => {
        e.stopPropagation();
        setActive(node);
      }}
    >
      <Text>{node.text}</Text>
    </Flex>
  );
};

const Edge = ({ from, to }) => {
  const x1 = from.x + from.w;
  const y1 = from.y + 32 / 2;
  const x2 = to.x;
  const y2 = to.y + 32 / 2;

  // svg path from node to node using bezier curve
  const path = `M${x1} ${y1} C${x1 + 50} ${y1}, ${x2 - 100} ${y2}, ${x2} ${y2}`;

  return <path d={path} fill="transparent" stroke="black" />;
};

function build(tree, i, arr, l, r) {
  if (l == r) {
    tree[i] = arr[l];
  } else {
    const m = (l + r) / 2;
    tree[i] =
      build(tree, 2 * i, arr, l, m) + build(tree, 2 * i + 1, arr, m + 1, r);
  }

  return tree[i];
}
