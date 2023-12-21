import {CarbonBlock, CarbonNode, RendererProps} from "@emrgen/carbon-core";

export const CodeComp = (props: RendererProps) => {
  const {node} = props;

  return (
    <CarbonBlock node={node}>
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
    </CarbonBlock>
  );
}
