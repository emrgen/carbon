import {CarbonBlock, CarbonNodeChildren, CarbonNodeContent, RendererProps, useCarbon} from "@emrgen/carbon-react";

export function ExplainComp(props: RendererProps) {
  const {node} = props;
  const app = useCarbon();

  return (
    <CarbonBlock {...props}>
      <div className={'carbon-block-explain'}>explanation</div>
      <CarbonNodeContent node={node}/>
      <CarbonNodeChildren node={node}/>
    </CarbonBlock>
  )
}
