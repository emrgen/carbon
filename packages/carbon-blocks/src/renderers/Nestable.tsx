import React, { useRef } from 'react';
import { CarbonBlock, CarbonNodeChildren, CarbonNodeContent, RendererProps, useSelectionHalo } from '@emrgen/carbon-core';

export const NestableComp = (props: RendererProps) => {
  const { node, placeholder } = props;
  const ref = useRef(null);
  const { attributes, SelectionHalo } = useSelectionHalo(props);

  // const { listeners } = useDragDropRectSelect({ node, ref });
  // console.log(node.textContent);
// console.log(attributes);

  return (
    <CarbonBlock node={node} ref={ref} custom={{...attributes}}>
      <CarbonNodeContent
        node={node}
        placeholder={placeholder ?? (node.isEmpty && node.placeholder)}
      />
      <CarbonNodeChildren node={node} />
      {SelectionHalo}
    </CarbonBlock>
  );
};
