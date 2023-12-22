import {CarbonBlock, CarbonNode, RendererProps, useSelectionHalo} from "@emrgen/carbon-core";
import {useRef} from "react";
import {useCombineConnectors, useConnectorsToProps, useDragDropRectSelect} from "@emrgen/carbon-dragon";

export const CodeComp = (props: RendererProps) => {
  const {node} = props;
  const ref = useRef(null);

  const selection = useSelectionHalo(props);
  const dragDropRect = useDragDropRectSelect({ node, ref });
  const connectors = useConnectorsToProps(
    useCombineConnectors(dragDropRect, selection)
  );

  return (
    <CarbonBlock {...props} ref={ref} custom={connectors}>
      {node.isVoid && (
        <div>
          click to edit
        </div>
      )}
      {!node.isVoid && (
        <pre>
          <code>
            {node.children.map((child, i) => (
              <CarbonNode node={child} key={child.key} custom={{lineNumber: i + 1}}/>
            ))}
          </code>
        </pre>
      )}
      {selection.SelectionHalo}
    </CarbonBlock>
  );
}
