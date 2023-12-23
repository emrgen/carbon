import {CarbonBlock, CarbonNode, RendererProps, useSelectionHalo} from "@emrgen/carbon-core";
import {useRef} from "react";
import {useCombineConnectors, useConnectorsToProps, useDragDropRectSelect} from "@emrgen/carbon-dragon";

export const CodeComp = (props: RendererProps) => {
  const {node} = props;
  const ref = useRef(null);

  const selection = useSelectionHalo(props);
  const dragDropRect = useDragDropRectSelect({node, ref});
  const connectors = useConnectorsToProps(
    useCombineConnectors(dragDropRect, selection)
  );

  return (
    <CarbonBlock
      {...props}
      ref={ref}
      custom={connectors}
    >
      {node.isVoid && (
        <div>
          click to edit
        </div>
      )}
      {!node.isVoid && (
        <pre>
          <code>
            <div className={'code-table'}>
              <div className={'code-table-header'}>
                <div className={'code-header-line'}>
                  <div>#</div>
                  <div>Line</div>
                </div>
              </div>
              <div className={'code-table-body'} contentEditable={true} suppressContentEditableWarning={true}>
                {node.children.map((child, i) => (
                  <div className={'carbon-code-line'} key={child.key}>
                    <div className={'code-line-number'} suppressContentEditableWarning={true} contentEditable={false}>{i + 1}</div>
                    <CarbonNode
                      node={child}
                      key={child.key}
                    />
                  </div>
                ))}
              </div>
            </div>
          </code>
        </pre>
      )}
      {selection.SelectionHalo}
    </CarbonBlock>
  );
}
