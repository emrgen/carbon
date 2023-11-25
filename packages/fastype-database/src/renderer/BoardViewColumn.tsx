import {
  CarbonBlock, CarbonNodeChildren,
  CarbonNodeContent,
  preventAndStop,
  RendererProps, stop,
  useCarbon,
  useSelectionHalo
} from "@emrgen/carbon-core";
import { useCallback, useMemo, useRef } from "react";
import { useCombineConnectors, useConnectorsToProps, useDraggable } from "@emrgen/carbon-dragon";
import { usePlaceholder } from "@emrgen/carbon-blocks";
import { Button, HStack, Stack } from "@chakra-ui/react";

export const BoardViewColumnComp = (props: RendererProps) => {
  const { node } = props;
  const ref = useRef(null);
  const app = useCarbon();

  const selection = useSelectionHalo(props);
  const draggable = useDraggable({ node, ref });
  const connectors = useConnectorsToProps(
    useCombineConnectors(draggable, selection)
  );

  const placeholder = usePlaceholder(node);
  // console.log(placeholder, node.firstChild?.isEmpty, node.attrs.node.emptyPlaceholder);
  //
  // const hasContent = useMemo(() => node.size > 1, [node]);
  //
  // const handleAddItem = useCallback((e) => {
  //   preventAndStop(e);
  //   console.log('add column item')
  //   // const column = app.schema.nodes.column.createAndFill();
  // }, [app]);

  return (
    <CarbonBlock node={node} ref={ref} custom={connectors}>
      <Stack spacing={4}>
        <CarbonNodeContent node={node} custom={{...placeholder, contentEditable: true}}/>
        <Stack>
          <CarbonNodeChildren node={node}/>
        </Stack>
      </Stack>
      {selection.SelectionHalo}
    </CarbonBlock>
  );
};
