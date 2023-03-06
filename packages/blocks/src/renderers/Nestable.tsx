import React, { useRef } from 'react';
import { CarbonBlock, CarbonNodeChildren, CarbonNodeContent, RendererProps } from '@emrgen/carbon-core';

export const NestableComp = (props: RendererProps) => {
  const { node, placeholder } = props;
  const ref = useRef(null);

  // const { listeners } = useDragDropRectSelect({ node, ref });

  return (
    <CarbonBlock node={node} ref={ref}>
      <CarbonNodeContent
        node={node}
        placeholder={placeholder ?? (node.isEmpty && node.placeholder)}
      />
      <CarbonNodeChildren node={node} />
      {/* <SelectionHalo node={node} /> */}
    </CarbonBlock>
  );
};
