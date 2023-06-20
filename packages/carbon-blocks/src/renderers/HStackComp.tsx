import React from 'react'
import { CarbonBlock, CarbonChildren, RendererProps } from '@emrgen/carbon-core'

export function HStackComp(props: RendererProps) {
  const {node} = props;

  return (
    <CarbonBlock {...props}>
      <CarbonChildren node={node} />
    </CarbonBlock>
  )
}
