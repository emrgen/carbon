
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

export const BoardViewColumnComp = (props: RendererProps) => {
  const { node } = props;
  const ref = useRef(null);
  const app = useCarbon();

  const selection = useSelectionHalo(props);
  const draggable = useDraggable({ node, ref });
  const connectors = useConnectorsToProps(
    useCombineConnectors(draggable, selection)
  );

  // const hasContent = useMemo(() => node.size > 1, [node]);
  //
  // const handleAddItem = useCallback((e) => {
  //   preventAndStop(e);
  //   console.log('add column item')
  //   // const column = react.schema.nodes.column.createAndFill();
  // }, [react]);

  return (
    <CarbonBlock node={node} ref={ref as any} custom={connectors}>
      <Stack spacing={4}>
        <CarbonNodeContent node={node} custom={{contentEditable: true}}/>
        <Stack>
          <CarbonNodeChildren node={node}/>
        </Stack>
      </Stack>
      {selection.SelectionHalo}
    </CarbonBlock>
  );
};
