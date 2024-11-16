import { Box, Circle, HStack, Switch, Text } from "@chakra-ui/react";
import { DndEvent, elementBound } from "@emrgen/carbon-dragon";
import { useMakeDraggable } from "@emrgen/carbon-dragon-react";
import { useRef, useState } from "react";

export const DraggableDemo = () => {
  const [startPosition, setStartPosition] = useState({ x: 0, y: 0 });
  const [endPosition, setEndPosition] = useState({ x: 0, y: 0 });
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const ref = useRef(null);

  const { listeners } = useMakeDraggable({
    handleRef: ref,
    onDragStart: (_: DndEvent) => {
      setStartPosition(elementBound(ref.current!));
      setDragging(true);
    },
    onDragMove: (event: DndEvent) => {
      setPosition(event.position);
    },
    onDragEnd: (event: DndEvent) => {
      setEndPosition(event.position);
      setDragging(false);
    },
  });

  return (
    <Box w={"full"} h={"full"} pos={"relative"}>
      <HStack justify={"space-between"} px={2} align={"center"} fontSize={"xs"}>
        <HStack spacing={10}>
          <Text>
            <b>Start</b> X: {startPosition.x}, Start Y: {startPosition.y}
          </Text>
          <Text py={2}>
            <b>Current</b> X: {position.x}, Y: {position.y}
          </Text>
          <Text>
            <b>End</b> X: {endPosition.x}, End Y: {endPosition.y}
          </Text>
        </HStack>

        <HStack align={"center"}>
          <Text>Dragging</Text>
          <Switch isChecked={dragging} />
        </HStack>
      </HStack>

      <Circle
        ref={ref}
        size={10}
        bg="red"
        pos={"absolute"}
        left={"200px"}
        top={"100px"}
        cursor={"grab"}
        userSelect={"none"}
        {...listeners}
      />
    </Box>
  );
};
