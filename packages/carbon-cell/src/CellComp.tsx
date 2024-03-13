import {CarbonBlock, CarbonChildren, RendererProps} from "@emrgen/carbon-react";

export const CellComp = (props: RendererProps) => {
  const {node} = props;

  return (
    <CarbonBlock node={node}>
      <div className={'carbon-cell-container'}>
        <div className={'carbon-cell-handle'}/>
        <div className={'carbon-cell-view'}>
          <CarbonChildren node={node}/>
        </div>
      </div>
    </CarbonBlock>
  )
}
