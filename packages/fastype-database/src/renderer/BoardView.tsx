
import { useCallback, useMemo, useRef } from "react";
import { Button, HStack, Stack } from "@chakra-ui/react";
import {useCombineConnectors, useConnectorsToProps, useDraggable} from "@emrgen/carbon-dragon-react";
import {
  CarbonBlock,
  CarbonNodeChildren,
  CarbonNodeContent,
  RendererProps,
  useCarbon,
  useSelectionHalo
} from "@emrgen/carbon-react";
import {Point, preventAndStop,Node} from "@emrgen/carbon-core";

export const BoardViewComp = (props: RendererProps) => {
  const { node } = props;
  const ref = useRef(null);
  const app = useCarbon();

  const selection = useSelectionHalo(props);
  const draggable = useDraggable({ node, ref });
  const connectors = useConnectorsToProps(
    useCombineConnectors(draggable, selection)
  );

  const hasContent = useMemo(() => node.size > 1, [node]);

  const handleAddColumn = useCallback((e) => {
    preventAndStop(e);
    console.log('add column')
    const column = app.schema.type('boardColumn')?.default();
    if (!column) return;

    const {tr} = app;
    const at = Point.toAfter(node.lastChild!.id);
    tr.Insert(at, column).Dispatch();
  }, [app, node.lastChild]);

  console.log(node);

  return (
    <CarbonBlock node={node} ref={ref as any} custom={connectors}>
      <Stack spacing={4}>
        <CarbonNodeContent node={node} custom={{contentEditable: true}}/>
        <HStack className={'board-columns'}>
          {hasContent &&  <CarbonNodeChildren node={node} />}
          <Button size={'sm'} w={'200px'} onClick={handleAddColumn} onMouseDown={stop} onMouseUp={stop}>Add column</Button>
        </HStack>
      </Stack>
      {selection.SelectionHalo}
    </CarbonBlock>
  );
};
